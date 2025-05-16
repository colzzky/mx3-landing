function debounce(func, wait, immediate = false) {
    let timeout, result;

    const debounced = function (...args) {
        const context = this;

        const later = function () {
            timeout = null;
            if (!immediate) {
                result = func.apply(context, args);
            }
        };

        const callNow = immediate && !timeout;

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) {
            result = func.apply(context, args);
        }

        return result;
    };

    debounced.cancel = function () {
        clearTimeout(timeout);
        timeout = null;
    };

    return debounced;
}

document.addEventListener("DOMContentLoaded", () => {
    if (!window.CSFORM_CONFIG) {
        console.error(
            "CSFORM_CONFIG is not defined. Please define the configuration object before loading the form script."
        );
        return;
    }
    if (!window.CSFORM_FORM) {
        window.CSFORM_FORM = [];
    }
    //Update page title
    document.title = window.CSFORM_CONFIG.title;
    PetiteVue.createApp({
        // Existing configuration propertiesÃ¢â‚¬Â¦
        config: {
            ...window.CSFORM_CONFIG,
            apiHost: "https://sg-aws.marketingmaster.io/apis_integrations",
            conversionEndpoint:
                "https://sg-aws.marketingmaster.io/apis_integrations/cform_handle_conversion_api",
        },
        formConfig: [
            // Optional fields here
            ...window.CSFORM_FORM,
        ],
        // Dynamically generate formData based on the fields configuration
        formData: {
            firstName: "",
            lastName: "",
            phone: "",
            email: "",
            'zip-code': "",
            streetAddress: "",
            barangay: "",
            city: "",
            province: "",
            ...window.CSFORM_FORM.reduce((data, field) => {
                data[field.id] = "";
                return data;
            }, {}),
            payment_method: "cod",
            order: bundle,
            amount: amount,
            quantity: 1,
        },
        productList: {
            "5-boxes": {
                price: 800,
                quantity: 5,
                name: "5-boxes of MX3 Coffee Mix"
            },
            "capsule coffee": {
                price: 100,
                quantity: 1,
                name: "1 Box of MX3 Capsule + 1 Box of MX3 Coffee Mix"
            }
        },
        barangays: [],
        meiliSearch: null,
        globalEventId: "",
        isLoading: false,
        isConfirmationVisible: false,
        isValidating: false,
        submitStatus: "",
        isPhoneInvalid: false,
        isEmailInvalid: false,
        showBarangayDropdown: false,
        showCityDropdown: false,
        showProvinceDropdown: false,
        popperInstance: null,
        popperCityInstance: null,
        popperProvinceInstance: null,
        isBarangaySearchLoading: false,
        isCitySearchLoading: false,
        isProvinceSearchLoading: false,
        cities: [],
        provinces: [],
        // OTP-related reactive properties
        otpDigits: ["", "", "", ""],
        otpSent: false,
        otpValidated: false,
        isOTPLoading: false,
        otpError: "",
        otpCacheKey: "",
        otpValidationToken: "",
        // New properties for OTP screen and timer
        showOTPScreen: false,
        otpCountdown: 300, // 5 minutes in seconds
        otpInterval: null,
        agreeToTerms: true,
        get totalPayable() {
            return this.formData.amount * this.formData.quantity;
        },
        async submitForm() {
            if (!this.validateForm()) return;
            const isContactDetailsValid = await this.validateContactDetails();
            if (!isContactDetailsValid) return;
            this.isConfirmationVisible = true;
            await this.reportConversion("AddToCart");
        },
        validateForm() {
            this.isValidating = true;
            const extreFieldsRequiredFieldErrors = [];
            for (const field of this.formConfig) {
                if (field.required && !this.formData[field.id]) {
                    extreFieldsRequiredFieldErrors.push(field.id);
                }
            }
            if (
                !this.formData.firstName ||
                !this.formData.lastName ||
                !this.formData.phone ||
                !this.formData.email ||
                extreFieldsRequiredFieldErrors.length > 0
            ) {
                alert("Please fill in all required fields.");
                return false;
            }
            this.saveFormInputs();
            return true;
        },
        buildPayload(EventName = "InitiateCheckout") {
            let fbc = this.getCookie("_fbc");
            let fbp = this.getCookie("_fbp");

            if (!fbc) {
                const fbclid = new URLSearchParams(window.location.search).get(
                    "fbclid"
                );
                if (fbclid) {
                    fbc = this.formatFbc(fbclid);
                }
            }

            if (!fbp) {
                fbp = this.formatFbp();
            }

            const hashedFirstName = CryptoJS.SHA256(
                this.formData.firstName
            ).toString();
            const hashedLastName = CryptoJS.SHA256(
                this.formData.lastName
            ).toString();
            const hashedPhone = CryptoJS.SHA256(this.formData.phone).toString();

            const userData = {
                fbc,
                fbp,
                ph: [hashedPhone],
                fn: [hashedFirstName],
                ln: [hashedLastName],
                client_ip_address: null,
                client_user_agent: navigator.userAgent,
            };

            if (this.formData.city) {
                const city = this.formData.city
                    .toLowerCase()
                    .replace(/\s/g, "")
                    .replace(/city/i, "");
                const hashedCity = CryptoJS.SHA256(city).toString();
                userData.ct = [hashedCity];
            }

            if (this.formData.email) {
                const hashedEmail = CryptoJS.SHA256(
                    this.formData.email
                ).toString();
                userData.em = [hashedEmail];
            }

            // Always use the current total and quantity for reporting
            return {
                event_name: EventName,
                event_time: Math.floor(Date.now() / 1000),
                action_source: "website",
                event_source_url: window.location.href,
                event_id: this.getEventId(EventName),
                user_data: userData,
                custom_data: {
                    currency: this.config.currency,
                    value: parseFloat(this.totalPayable).toFixed(2),
                    quantity: this.formData.quantity,
                },
            };
        },
        formatFbc(fbclid, domainIndex = 1) {
            const creationTime = Date.now();
            return `fb.${domainIndex}.${creationTime}.${fbclid}`;
        },
        formatFbp(domainIndex = 1) {
            const creationTime = Date.now();
            const randomNumber = Math.floor(Math.random() * 1e10);
            return `fb.${domainIndex}.${creationTime}.${randomNumber}`;
        },
        getCookie(name) {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(";").shift();
            return null;
        },
        formatToPeso(amount) {
            return new Intl.NumberFormat('en-PH', {
                style: 'currency',
                currency: 'PHP',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        },
        increaseQuantity() {
            this.formData.quantity++;
            console.log(this.formData.quantity);
        },
        decreaseQuantity() {
            if (this.formData.quantity > 1) {
                this.formData.quantity--;
            }
            console.log(this.formData.quantity);
        },
        async finalizeSubmission() {
            this.isLoading = true;
            await this.reportConversion("InitiateCheckout");
            await this.reportConversion("CompleteRegistration");
            await this.reportConversion("Lead");
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            const allQueryParams = new URLSearchParams(window.location.search);
            const allQueryParamsJson = {};
            for (const [key, value] of allQueryParams) {
                allQueryParamsJson[key] = value;
            }

            const raw = JSON.stringify({
                data: {
                    ...this.formData,
                },
                conversionApi: this.buildPayload(),
                metaPixelId: this.config.metaPixelId,
                conversionApiToken: this.config.conversionApiToken,
                params: allQueryParamsJson,
                verificationToken: this.otpValidationToken,
                sheet_id: this.config.sheet_id,
                sheet_name: this.config.sheet_name,
                businessEmail: this.config.businessEmail,
                businessPhone: this.config.businessPhone,
                businessName: this.config.businessName,
            });

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };

            const loader = document.getElementById("loader");
            loader.style.display = "flex";
            this.saveFormInputs();
            fetch(this.config.apiHost + "/cform_handle_submit", requestOptions)
                .then((response) => response.json())
                .then(async (data) => {
                    console.log(data);
                    loader.style.display = "none"
                    console.log("Submitting form:", JSON.parse(raw));
                    if (data.status) {
                        this.submitStatus = "success";
                        await this.reportConversion("Purchase");
                        if (this.config.thankyouUrl) {
                            window.location.href = this.config.thankyouUrl;
                        }
                    } else {
                        this.submitStatus = "failed";
                    }
                    return data;
                })
                .catch((error) => {
                    setTimeout(() => {
                        loader.style.display = "none";
                    }, 1000);
                    console.error("Error submitting form:", error);
                })
        },
        saveFormInputs() {
            localStorage.setItem("formData", JSON.stringify(this.formData));
        },
        refresh() {
            window.location.href =
                window.location.origin + window.location.pathname;
        },
        getEventId(eventName) {
            return eventName.toLowerCase() + this.globalEventId;
        },
        reportConversion(eventName = "Purchase") {
            // Always send the current total and quantity to Meta Pixel
            fbq(
                "track",
                eventName,
                {
                    currency: this.config.currency,
                    value: parseFloat(this.totalPayable).toFixed(2),
                    quantity: this.formData.quantity,
                },
                { eventID: this.getEventId(eventName) }
            );

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            const allQueryParams = new URLSearchParams(window.location.search);
            const allQueryParamsJson = {};
            for (const [key, value] of allQueryParams) {
                allQueryParamsJson[key] = value;
            }

            const raw = JSON.stringify({
                data: {
                    ...this.formData,
                    total: this.totalPayable,
                },
                conversionApi: this.buildPayload(eventName),
                metaPixelId: this.config.metaPixelId,
                conversionApiToken: this.config.conversionApiToken,
                params: allQueryParamsJson,
            });

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: raw,
                redirect: "follow",
            };
            console.log("Submitting conversion:", JSON.parse(raw));

            return new Promise((resolve, error) => {
                fetch(this.config.conversionEndpoint, requestOptions)
                    .then((response) => response.text())
                    .then((data) => {
                        console.log(data);
                        this.isLoading = false;
                        resolve(data);
                    })
                    .catch((error) => {
                        console.error("Error submitting form:", error);
                        this.isLoading = false;
                    })
                    .finally(() => {
                        this.isLoading = false;
                    });
            });
        },
        validatePhoneNumber(phoneNumber) {
            if (!phoneNumber) {
                return Promise.resolve(false);
            }
            phoneNumber = this.transformPhoneNumber(phoneNumber);
            if (!phoneNumber || !/^\d+$/.test(phoneNumber)) {
                return Promise.resolve(false);
            }
            if (typeof Storage !== "undefined") {
                const validatedPhone = localStorage.getItem(phoneNumber);
                if (validatedPhone) {
                    return Promise.resolve(
                        validatedPhone === "invalid" ? false : validatedPhone
                    );
                }
            }
            return new Promise((resolve, error) => {
                fetch(
                    `https://sg.marketingmaster.io/apis_sms/validate_phone/${phoneNumber}`
                )
                    .then((response) => response.text())
                    .then((result) => {
                        const data = JSON.parse(result);
                        if (typeof Storage !== "undefined") {
                            localStorage.setItem(
                                phoneNumber,
                                data.valid ? data.formatted : "invalid"
                            );
                        }
                        resolve(data.valid ? data.formatted : false);
                    })
                    .catch((error) => console.error(error));
            });
        },
        transformPhoneNumber(input) {
            let digits = input.replace(/\D/g, "");
            if (digits.startsWith("63")) {
            } else if (digits.startsWith("0")) {
                digits = "63" + digits.substring(1);
            } else {
                digits = "63" + digits;
            }
            return digits;
        },
        validateEmail(email) {
            if (!email) {
                return Promise.resolve(false);
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return Promise.resolve(false);
            }
            if (typeof Storage !== "undefined") {
                const validatedEmail = localStorage.getItem(email);
                if (validatedEmail) {
                    return Promise.resolve(
                        validatedEmail === "invalid" ? false : email
                    );
                }
            }
            return new Promise((resolve, error) => {
                fetch(
                    `https://sg.marketingmaster.io/apis_sms/validate_email/${email}`
                )
                    .then((response) => response.text())
                    .then((result) => {
                        const data = JSON.parse(result);
                        if (typeof Storage !== "undefined") {
                            localStorage.setItem(
                                email,
                                data.valid ? email : "invalid"
                            );
                        }
                        resolve(data.valid ? email : false);
                    })
                    .catch((error) => console.error(error));
            });
        },
        async validateContactDetails() {
            const loader = document.getElementById("loader");
            loader.style.display = "flex";
            const forValidationPromises = [
                this.validatePhoneNumber(this.formData.phone),
                this.validateEmail(this.formData.email),
            ];
            const [validatedPhone, validatedEmail] = await Promise.all(
                forValidationPromises
            );
            if (!validatedPhone && this.config.requirePhone) {
                this.isValidating = true;
                this.isPhoneInvalid = true;
                alert("Phone number is invalid. Please check the input.");
                loader.style.display = "none";
                return false;
            }
            if (!validatedEmail && this.config.requireEmail) {
                this.isValidating = true;
                this.isEmailInvalid = true;
                loader.style.display = "none";
                alert("Email is invalid. Please check the input.");
                return false;
            }
            this.formData.phone = validatedPhone;
            loader.style.display = "none";
            return true;
        },
        // Updated OTP: Request OTP and show separate OTP screen with countdown
        sendOTP() {
            if (!this.agreeToTerms) {
                alert("Please agree to the terms and conditions.");
                return;
            }
            if (!this.formData.phone) {
                alert("Phone number is required to send OTP.");
                return;
            }
            this.isOTPLoading = true;

            fetch(
                this.config.apiHost +
                "/cform_request_otp?phone_number=" +
                this.formData.phone +
                "&senderId=" +
                this.config.senderId
            )
                .then((response) => response.json())
                .then((data) => {
                    const { cache_key } = data;
                    this.otpCacheKey = cache_key;
                    this.otpSent = true;
                    this.showOTPScreen = true;
                    this.startOtpCountdown();
                    alert("OTP sent successfully. Please check your SMS.");
                    this.isOTPLoading = false;
                    return data;
                })
                .catch((error) => {
                    this.isOTPLoading = false;
                })
                .finally((data) => {
                    this.isOTPLoading = false;
                });
        },
        // Updated OTP: Verify OTP using the digits entered
        verifyOTP() {
            const otp = this.otpDigits.join("");
            if (otp.length !== 4) {
                alert("Please enter a valid 4-digit OTP.");
                return;
            }
            this.isOTPLoading = true;
            const loader = document.getElementById("loader");
            loader.style.display = "flex";
            fetch(
                this.config.apiHost +
                `/cform_verify_otp?cache_key=${this.otpCacheKey}&otp=${otp}`
            )
                .then((response) => response.json())
                .then((data) => {
                    const { status, verification_token } = data;
                    if (!status) {
                        loader.style.display = "none";
                        alert("Invalid OTP. Please try again.");
                        this.isOTPLoading = false;
                        this.otpValidated = false;
                        return;
                    }
                    this.otpValidationToken = verification_token;
                    this.otpValidated = true;
                    clearInterval(this.otpInterval);
                    alert("OTP validated successfully.");
                    this.finalizeSubmission();
                    this.isOTPLoading = false;
                    return data;
                })
                .catch((error) => {
                    this.isOTPLoading = false;
                })
                .finally((data) => {
                    this.isOTPLoading = false;
                });
        },
        // New method to start a 5-minute countdown timer
        startOtpCountdown() {
            this.otpCountdown = 300;
            if (this.otpInterval) {
                clearInterval(this.otpInterval);
            }
            this.otpInterval = setInterval(() => {
                if (this.otpCountdown > 0) {
                    this.otpCountdown--;
                } else {
                    clearInterval(this.otpInterval);
                }
            }, 1000);
        },
        // OTP input event handlers (using a multi-input approach)
        handleOtpKeydown(index, event) {
            if (
                !/^\d$/.test(event.key) &&
                event.key !== "Backspace" &&
                event.key !== "Delete" &&
                event.key !== "Tab" &&
                !event.metaKey
            ) {
                event.preventDefault();
            }
            if (event.key === "Backspace" || event.key === "Delete") {
                if (index > 0) {
                    this.otpDigits[index] = "";
                    document.getElementById("otp" + (index - 1)).focus();
                }
            }
        },
        handleOtpInput(index, event) {
            if (event.target.value && index < this.otpDigits.length - 1) {
                document.getElementById("otp" + (index + 1)).focus();
            }
        },
        handleOtpFocus(event) {
            event.target.select();
        },
        handleOtpPaste(event) {
            event.preventDefault();
            const text = event.clipboardData.getData("text");
            if (!/^\d{4}$/.test(text)) return;
            this.otpDigits = text.split("");
        },
        initMeiliSearch(index = "baranggays") {
            const client = new meilisearch.MeiliSearch({
                host: "https://search.idrs.ph",
                apiKey: "b78c1af715c42062845f4f7ad7707e9760c505b23d06f35786af6d0b4f967c9f"
            });
            return client.index(index);
        },
        getBarangays: debounce(function () {
            if (this.formData.barangay && this.formData.barangay.length > 1) {
                this.isBarangaySearchLoading = false;
            }
        }, 300),
        getCities: debounce(function () {
            if (this.formData.city && this.formData.city.length > 1) {
                this.isCitySearchLoading = true;
                this.showCityDropdown = true;
                this.initMeiliSearch().search(this.formData.city, {
                    attributesToSearchOn: ['city_municipality', 'province', 'region']
                }).then((res) => {
                    // Remove duplicates by city name
                    const uniqueCities = [];
                    const cityNames = new Set();

                    res.hits.forEach(hit => {
                        if (!cityNames.has(hit.city_municipality)) {
                            cityNames.add(hit.city_municipality);
                            uniqueCities.push({
                                name: hit.city_municipality,
                                province: hit.province || hit.region
                            });
                        }
                    });

                    this.cities = uniqueCities;
                    this.isCitySearchLoading = false;
                    // Initialize or update Popper after results are loaded
                    this.$nextTick(() => {
                        this.initPopper('city');
                    });
                }).catch(err => {
                    console.error('Error searching cities:', err);
                    this.isCitySearchLoading = false;
                });
            } else {
                this.cities = [];
                this.showCityDropdown = false;
                this.isCitySearchLoading = false;
            }
        }, 300),
        getProvinces: debounce(function () {
            if (this.formData.province && this.formData.province.length > 1) {
                this.isProvinceSearchLoading = true;
                this.showProvinceDropdown = true;
                this.initMeiliSearch().search(this.formData.province, {
                    attributesToSearchOn: ['province', 'region']
                }).then((res) => {
                    // Remove duplicates by province/region name
                    const uniqueProvinces = [];
                    const provinceNames = new Set();

                    res.hits.forEach(hit => {
                        const provinceName = hit.province || hit.region;
                        if (provinceName && !provinceNames.has(provinceName)) {
                            provinceNames.add(provinceName);
                            uniqueProvinces.push({
                                name: provinceName
                            });
                        }
                    });

                    this.provinces = uniqueProvinces;
                    this.isProvinceSearchLoading = false;
                    // Initialize or update Popper after results are loaded
                    this.$nextTick(() => {
                        this.initPopper('province');
                    });
                }).catch(err => {
                    console.error('Error searching provinces:', err);
                    this.isProvinceSearchLoading = false;
                });
            } else {
                this.provinces = [];
                this.showProvinceDropdown = false;
                this.isProvinceSearchLoading = false;
            }
        }, 300),
        selectBarangay(barangay) {
            this.formData.barangay = barangay.brgy;
            this.formData.city = barangay.city_municipality;
            this.formData.province = barangay.province || barangay.region;
            this.showBarangayDropdown = false;
            const event = new CustomEvent('barangay-selected', {
                detail: { barangay: barangay }
            });
            document.dispatchEvent(event);
        },
        selectCity(city) {
            this.formData.city = city.name;
            // If the city has province info, update that field too
            if (city.province) {
                this.formData.province = city.province;
            }
            this.showCityDropdown = false;
            const event = new CustomEvent('city-selected', {
                detail: { city: city }
            });
            document.dispatchEvent(event);
        },
        selectProvince(province) {
            this.formData.province = province.name;
            this.showProvinceDropdown = false;
            const event = new CustomEvent('province-selected', {
                detail: { province: province }
            });
            document.dispatchEvent(event);
        },
        initPopper(type = 'barangay') {
            let input, dropdown, popperInstanceVar;

            // Determine which elements to use based on type
            switch (type) {
                case 'city':
                    input = document.getElementById('city');
                    dropdown = this.$refs.cityDropdown;
                    popperInstanceVar = 'popperCityInstance';
                    break;
                case 'province':
                    input = document.getElementById('province');
                    dropdown = this.$refs.provinceDropdown;
                    popperInstanceVar = 'popperProvinceInstance';
                    break;
                default: // barangay
                    input = document.getElementById('barangay');
                    dropdown = this.$refs.barangayDropdown;
                    popperInstanceVar = 'popperInstance';
                    break;
            }

            // Make sure both elements exist
            if (!input || !dropdown || !window.Popper) return;

            // Create or update the Popper instance
            if (this[popperInstanceVar]) {
                this[popperInstanceVar].update();
            } else {
                this[popperInstanceVar] = Popper.createPopper(input, dropdown, {
                    placement: 'bottom-start',
                    modifiers: [
                        {
                            name: 'offset',
                            options: {
                                offset: [0, 4],
                            },
                        },
                        {
                            name: 'preventOverflow',
                            options: {
                                boundary: document.body,
                            },
                        }
                    ],
                });
            }
        },
        setupClickOutside() {
            // Add click outside listener to close all dropdowns
            document.addEventListener('click', (event) => {
                // Handle barangay dropdown
                const barangayInput = document.getElementById('barangay');
                const barangayDropdown = this.$refs.barangayDropdown;

                if (barangayInput && barangayDropdown &&
                    !barangayInput.contains(event.target) &&
                    !barangayDropdown.contains(event.target)) {
                    this.showBarangayDropdown = false;
                }

                // Handle city dropdown
                const cityInput = document.getElementById('city');
                const cityDropdown = this.$refs.cityDropdown;

                if (cityInput && cityDropdown &&
                    !cityInput.contains(event.target) &&
                    !cityDropdown.contains(event.target)) {
                    this.showCityDropdown = false;
                }

                // Handle province dropdown
                const provinceInput = document.getElementById('province');
                const provinceDropdown = this.$refs.provinceDropdown;

                if (provinceInput && provinceDropdown &&
                    !provinceInput.contains(event.target) &&
                    !provinceDropdown.contains(event.target)) {
                    this.showProvinceDropdown = false;
                }
            });

            // Setup keyboard event listeners for Escape key
            document.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    // Close all dropdowns when Escape is pressed
                    this.showBarangayDropdown = false;
                    this.showCityDropdown = false;
                    this.showProvinceDropdown = false;
                }
            });
        },
        mounted() {
            this.globalEventId = Math.random().toString(36).substring(2, 15);
            if (localStorage.getItem("formData")) {
                this.formData = {...this.formData, ...JSON.parse(localStorage.getItem("formData"))};
            }

            // Setup click outside handler for the barangay dropdown
            this.setupClickOutside();
            if (window.location.search.includes("submission_status=success")) {
                this.submitStatus = "success";
                setTimeout(async () => {
                    await this.reportConversion("Purchase");
                }, 1000);
            } else if (
                window.location.search.includes("submission_status=failed")
            ) {
                this.submitStatus = "failed";
            }
            const loader = document.getElementById("loader");
            const app = document.getElementById("app");
            app.style.display = "flex";

            const placeholderApp = document.getElementById("placeholder-app");
            placeholderApp.style.display = "none";

            loader.style.display = "none";
            fbq("init", this.config.metaPixelId);
            fbq("track", "PageView");
            this.meiliSearch = this.initMeiliSearch();
            console.log({
                formData: this.formData,
            });
        },
    }).mount("#app");
});