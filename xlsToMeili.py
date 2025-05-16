#!/usr/bin/env python3

import pandas as pd
import http.client
import json
import argparse
import os
import time
from tqdm import tqdm


def read_file_in_batches(file_path, batch_size=100, sheet_name=None):
    """
    Read an Excel or TSV file in batches to avoid loading the entire file into memory.
    
    Args:
        file_path: Path to the file to read
        batch_size: Number of rows to read at a time
        sheet_name: Specific sheet to read for Excel files (None uses the first sheet)
    """
    try:
        # Determine file type based on extension
        file_ext = file_path.lower().split('.')[-1]
        
        if file_ext in ['xls', 'xlsx', 'xlsm']:
            # For Excel files - pandas read_excel doesn't support chunking directly
            print(f"Reading Excel file: {file_path}")
            xls = pd.ExcelFile(file_path)
            
            # If no sheet specified, use the first one
            if sheet_name is None:
                sheet_name = xls.sheet_names[0]
            elif sheet_name not in xls.sheet_names:
                available_sheets = ", ".join(xls.sheet_names)
                raise ValueError(f"Sheet '{sheet_name}' not found. Available sheets: {available_sheets}")
                
            print(f"Reading sheet: {sheet_name}")
            
            # Read the full dataframe, which is necessary for Excel files
            df = pd.read_excel(xls, sheet_name=sheet_name)
            total_rows = len(df)
            print(f"Total rows in Excel file: {total_rows}")
            
            # Yield chunks of the dataframe
            for i in range(0, total_rows, batch_size):
                end_idx = min(i + batch_size, total_rows)
                print(f"Processing rows {i} to {end_idx}")
                yield df.iloc[i:end_idx].copy()
                
        elif file_ext in ['tsv', 'txt']:
            # For TSV/TXT files
            # Count lines to get total rows (skip header)
            with open(file_path, 'r') as f:
                total_rows = sum(1 for _ in f) - 1  # Subtract 1 for header
            print(f"Total rows in TSV file: {total_rows}")
            
            # Read TSV file in chunks - this works natively with chunksize
            for chunk in pd.read_csv(file_path, sep='\t', chunksize=batch_size):
                yield chunk
                
        else:
            raise ValueError(f"Unsupported file format: {file_ext}")
            
    except Exception as e:
        print(f"Error reading file: {e}")
        raise


def list_excel_sheets(file_path):
    """
    List all available sheets in an Excel file.
    """
    try:
        file_ext = file_path.lower().split('.')[-1]
        if file_ext not in ['xls', 'xlsx', 'xlsm']:
            print(f"File {file_path} is not an Excel file.")
            return
            
        xls = pd.ExcelFile(file_path)
        print(f"\nAvailable sheets in {file_path}:")
        for i, sheet in enumerate(xls.sheet_names, 1):
            print(f"  {i}. {sheet}")
            
    except Exception as e:
        print(f"Error listing sheets: {e}")


def process_data(df, parent_hierarchy=None):
    """
    Process the dataframe to extract required fields and structure data according to hierarchy.
    Only processes barangay-level records while maintaining hierarchical information.
    All barangays are associated with their parent administrative units based on the hierarchical order.
    
    Args:
        df: DataFrame to process
        parent_hierarchy: Dictionary with parent hierarchy from previous batch (if any)
    """
    documents = []
    
    # Print the actual columns we're working with to help debug
    print(f"Original columns: {df.columns.tolist()}")
    
    # Instead of renaming, try to identify key columns by their actual names or positions
    psgc_col = None
    name_col = None
    geo_level_col = None
    
    # First try to identify the exact column names from the PSGC Excel file
    if '10-digit PSGC' in df.columns:
        psgc_col = '10-digit PSGC'
    if 'Name' in df.columns:
        name_col = 'Name'
    if 'Geographic Level' in df.columns:
        geo_level_col = 'Geographic Level'
        
    # If we didn't find the exact columns, try by common names
    if not all([psgc_col, name_col, geo_level_col]):
        for col in df.columns:
            col_lower = str(col).lower()
            # Try to identify the PSGC column (usually has 'code' or 'psgc' in the name)
            if ('psgc' in col_lower or 'code' in col_lower or 'id' in col_lower) and not psgc_col:
                psgc_col = col
            # Name or description column
            elif ('name' in col_lower or 'description' in col_lower) and not name_col:
                name_col = col
            # Geographic level column
            elif ('level' in col_lower or 'geo' in col_lower or 'type' in col_lower) and not geo_level_col:
                geo_level_col = col
    
    # If we couldn't find the columns by name, make educated guesses based on content
    if not all([psgc_col, name_col, geo_level_col]):
        # For the first non-header row, check content types
        for col in df.columns:
            # Sample some values to determine column type
            sample_vals = df[col].dropna().head(5).tolist()
            if not sample_vals:
                continue
                
            # Check if column contains numeric IDs (potential PSGC)
            if all(str(val).isdigit() for val in sample_vals) and not psgc_col:
                psgc_col = col
            # Check for text that might be geographic levels
            elif any(level in str(val).upper() for val in sample_vals 
                    for level in ['REG', 'PROV', 'MUN', 'CITY', 'BGY']) and not geo_level_col:
                geo_level_col = col
            # Assume the remaining primary text column is names
            elif all(isinstance(val, str) for val in sample_vals) and not name_col:
                name_col = col
    
    # Fallback to positional columns if we still can't identify
    if not psgc_col and len(df.columns) > 0:
        psgc_col = df.columns[0]
    if not name_col and len(df.columns) > 1:
        name_col = df.columns[1]
    if not geo_level_col and len(df.columns) > 3:
        geo_level_col = df.columns[3]
    
    print(f"Using columns - PSGC: {psgc_col}, Name: {name_col}, Geographic Level: {geo_level_col}")
    
    # If we still can't find essential columns, return empty
    if not all([psgc_col, name_col, geo_level_col]):
        print("ERROR: Could not identify required columns. Please specify correct sheet or format.")
        return [], None
    
    # Track hierarchy information as we process the file
    # Use parent hierarchy if provided, otherwise initialize a new one
    hierarchy = parent_hierarchy or {
        'region': None,
        'province': None,
        'city_municipality': None,
        'submun': None
    }
    
    print(f"Starting hierarchy state: {hierarchy}")
    
    # Process each row in the dataframe
    row_count = 0
    for _, row in df.iterrows():
        # Skip rows with missing PSGC or name
        if pd.isna(row[psgc_col]) or pd.isna(row[name_col]):
            continue
        
        row_count += 1
        name_value = str(row[name_col])
        
        # Debug output for the first few rows
        if row_count <= 3:
            print(f"Sample row {row_count}: PSGC={row[psgc_col]}, Name={name_value}, Level={row[geo_level_col]}")
            
        # Convert PSGC to string and ensure it's 10 digits
        try:
            psgc_val = str(row[psgc_col])
            # Remove any decimal points and convert to integer
            if '.' in psgc_val:
                psgc_val = psgc_val.split('.')[0]
            psgc = str(int(psgc_val)).zfill(10)
        except (ValueError, TypeError):
            # Skip rows with invalid PSGC codes
            continue
            
        # Get geographic level and standardize it
        geo_level = str(row[geo_level_col]).strip() if not pd.isna(row[geo_level_col]) else ""
        
        # Handle various ways geographic levels might be represented
        level_mapping = {
            'REG': ['REG', 'REGION', 'RGN'],
            'PROV': ['PROV', 'PROVINCE', 'PV'],
            'CITY': ['CITY', 'CT'],
            'MUN': ['MUN', 'MUNICIPAL', 'MUNICIPALITY'],
            'SUBMUN': ['SUBMUN', 'SUB-MUNIC', 'SUBMUNICIPALITY'],
            'BGY': ['BGY', 'BRGY', 'BARANGAY']
        }
        
        # Standardize the geographic level
        standardized_level = None
        for std_level, variations in level_mapping.items():
            if any(var in geo_level.upper() for var in variations):
                standardized_level = std_level
                break
        
        if not standardized_level:
            # If we can't determine the level, try to infer from PSGC code structure
            # This is a fallback in case the geographic level column is empty or unclear
            psgc_digits = len(psgc.strip('0'))
            if psgc_digits <= 2:
                standardized_level = 'REG'
            elif psgc_digits <= 4:
                standardized_level = 'PROV'
            elif psgc_digits <= 6:
                standardized_level = 'CITY' if 'CITY' in name_value.upper() else 'MUN'
            elif psgc_digits <= 8:
                standardized_level = 'SUBMUN'
            else:
                standardized_level = 'BGY'
            
            # Still skip if we can't determine a level
            if not standardized_level:
                continue
                
        print(f"Row {row_count}: Processing {standardized_level} {name_value}")
        
        # Update hierarchy tracking variables based on geographic level
        if standardized_level == 'REG':
            # When we find a region, update the region and reset lower levels
            print(f"  Updating region to: {name_value}")
            hierarchy['region'] = name_value
            # Reset lower hierarchy levels when we encounter a new parent
            hierarchy['province'] = None
            hierarchy['city_municipality'] = None
            hierarchy['submun'] = None
            
        elif standardized_level == 'PROV':
            # When we find a province, update the province and reset lower levels
            # The region remains the same (already set)
            print(f"  Updating province to: {name_value}")
            hierarchy['province'] = name_value
            # Reset lower hierarchy levels
            hierarchy['city_municipality'] = None
            hierarchy['submun'] = None
            
        elif standardized_level in ['CITY', 'MUN']:
            # When we find a city/municipality, update it and reset lower levels
            # Region and province remain the same (already set)
            print(f"  Updating city/municipality to: {name_value}")
            hierarchy['city_municipality'] = name_value
            # Reset lower hierarchy level
            hierarchy['submun'] = None
            
        elif standardized_level == 'SUBMUN':
            # When we find a sub-municipality, update it
            # Region, province, and city/municipality remain the same (already set)
            print(f"  Updating submun to: {name_value}")
            hierarchy['submun'] = name_value
            
        elif standardized_level == 'BGY':
            # For barangay level, create a document with all its parent entities
            print(f"  Creating document for barangay: {name_value}")
            print(f"  Using hierarchy: {hierarchy}")
            
            # Check if we have parent information
            if not hierarchy['city_municipality'] and not hierarchy['province'] and not hierarchy['region']:
                print(f"  WARNING: No parent information for barangay {name_value}")
            
            document = {
                'id': psgc,
                'brgy': name_value,
                'city_municipality': hierarchy['city_municipality'],
                'province': hierarchy['province'],
                'region': hierarchy['region'],
                'submun': hierarchy['submun'],  # Include submun in the document if available
                'geographic_level': standardized_level,
                'psgc': psgc
            }
            
            # Add any additional columns if they exist in the dataset
            population_col = next((col for col in df.columns if 'population' in str(col).lower()), None)
            if population_col and not pd.isna(row.get(population_col)):
                try:
                    document['population'] = int(float(row[population_col]))
                except (ValueError, TypeError):
                    pass  # Skip if population can't be converted to int
            
            documents.append(document)
            
        # For debugging - after processing every 100 rows, print the current hierarchy
        if row_count % 100 == 0:
            print(f"Row {row_count} - Current hierarchy: {hierarchy}")
    
    # Print final hierarchy state for debugging
    print(f"Final hierarchy state after processing batch: {hierarchy}")
    print(f"Created {len(documents)} barangay documents in this batch")
    
    return documents, hierarchy


def upload_to_meilisearch(documents, host="search.idrs.ph", index="baranggays", api_key="MFDtw9XFD3yL832pxJLliRR2Fhb5UJ"):
    """
    Upload a batch of documents to MeiliSearch.
    """
    if not documents:
        return {"message": "No documents to upload"}
        
    try:
        # Using requests library instead of http.client to better handle SSL issues
        import requests
        import urllib3
        
        # Disable SSL warnings (only use in development/testing)
        urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
        
        url = f"https://{host}/indexes/{index}/documents"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        
        # Set verify=False to bypass SSL certificate verification
        # NOTE: In production, you should properly handle certificates instead
        response = requests.post(
            url,
            json=documents,
            headers=headers,
            verify=False  # This bypasses SSL certificate verification
        )
        
        if response.status_code >= 200 and response.status_code < 300:
            return response.json()
        else:
            error_msg = f"Error {response.status_code}: {response.text}"
            print(error_msg)
            return {"error": error_msg}
            
    except Exception as e:
        print(f"Error uploading to MeiliSearch: {e}")
        return {"error": str(e)}


def main():
    parser = argparse.ArgumentParser(description='Upload data from Excel/TSV to MeiliSearch in batches')
    parser.add_argument('--file', '-f', required=True, help='Path to the Excel or TSV file')
    parser.add_argument('--batch', '-b', type=int, default=200, help='Batch size for uploads')
    parser.add_argument('--host', default="search.idrs.ph", help='MeiliSearch host')
    parser.add_argument('--index', default="baranggays", help='MeiliSearch index name')
    parser.add_argument('--key', default="MFDtw9XFD3yL832pxJLliRR2Fhb5UJ", help='MeiliSearch API key')
    parser.add_argument('--dry-run', action='store_true', help='Process data without uploading to MeiliSearch')
    parser.add_argument('--sheet', default=None, help='Specific sheet name to read from Excel file (for Excel files only)')
    parser.add_argument('--list-sheets', action='store_true', help='List available sheets in the Excel file and exit')
    parser.add_argument('--debug', action='store_true', help='Print additional debug information')
    args = parser.parse_args()
    
    if not os.path.exists(args.file):
        print(f"Error: File {args.file} does not exist")
        return
        
    # Check if we're just listing sheets in an Excel file
    if args.list_sheets:
        file_ext = args.file.lower().split('.')[-1]
        if file_ext in ['xls', 'xlsx', 'xlsm']:
            list_excel_sheets(args.file)
        else:
            print(f"File {args.file} is not an Excel file. Can't list sheets.")
        return
        
    try:
        total_documents = 0
        batch_count = 0
        print(f"Processing {args.file} in batches of {args.batch} rows...")
        
        # Initialize hierarchy tracking dictionary to maintain state between batches
        current_hierarchy = None
        
        # Process the file in batches
        for batch_df in read_file_in_batches(args.file, args.batch, sheet_name=args.sheet):
            batch_count += 1
            print(f"\n{'='*40}\nProcessing batch {batch_count}...\n{'='*40}")
            
            # Process the batch data with the current hierarchy state
            documents, current_hierarchy = process_data(batch_df, parent_hierarchy=current_hierarchy)
            total_documents += len(documents)
            
            # Print hierarchy statistics in debug mode
            if args.debug and documents:
                # Count how many documents have each hierarchy level filled
                region_count = sum(1 for d in documents if d.get('region'))
                province_count = sum(1 for d in documents if d.get('province'))
                city_mun_count = sum(1 for d in documents if d.get('city_municipality'))
                submun_count = sum(1 for d in documents if d.get('submun') and d['submun'] is not None)
                
                # Only calculate percentages if we have documents
                if len(documents) > 0:
                    print(f"Hierarchy stats for batch {batch_count}:")
                    print(f"  Total documents: {len(documents)}")
                    print(f"  With region: {region_count} ({region_count/len(documents)*100:.1f}%)")
                    print(f"  With province: {province_count} ({province_count/len(documents)*100:.1f}%)")
                    print(f"  With city/mun: {city_mun_count} ({city_mun_count/len(documents)*100:.1f}%)")
                    print(f"  With submun: {submun_count} ({submun_count/len(documents)*100:.1f}%)")
                    
                    # Print a sample document
                    if documents:
                        print(f"Sample document:\n{json.dumps(documents[0], indent=2)}")
            
            if documents:
                # Count documents with hierarchy info
                has_hierarchy = sum(1 for d in documents if d.get('region') and d.get('province') and d.get('city_municipality'))
                print(f"Batch has {len(documents)} documents, {has_hierarchy} with complete hierarchy information.")
                
                if args.dry_run:
                    # In dry-run mode, just print the first document as example
                    print(f"Would upload {len(documents)} documents in dry-run mode.")
                    print(f"Example document:\n{json.dumps(documents[0], indent=2)}")
                else:
                    # Upload the batch to MeiliSearch
                    print(f"Uploading {len(documents)} documents...")
                    result = upload_to_meilisearch(
                        documents, 
                        host=args.host, 
                        index=args.index, 
                        api_key=args.key
                    )
                    print(f"Upload result: {result}")
                    
            # If debugging is on, show the current hierarchy after each batch
            if args.debug:
                print(f"Current hierarchy at end of batch {batch_count}: {current_hierarchy}")
                
            # If no documents were found in this batch, print a message
            if not documents:
                print(f"No barangay documents found in batch {batch_count}. Hierarchy state: {current_hierarchy}")
                
            print(f"Completed batch {batch_count}, Total documents so far: {total_documents}")
            
            # Add a small delay between batches to avoid overwhelming the server
            time.sleep(1)
        
        print(f"Completed processing. Total documents processed: {total_documents}")
        
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    main()