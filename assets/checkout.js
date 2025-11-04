// ===== PROMO CONFIGURATION =====
// Add promo periods here with start date, end date, and discount percentage
// Dates are in Philippine Time (Asia/Manila, UTC+8)
const PROMO_CONFIG = [
    // Example promo periods (uncomment and modify as needed):
    // {
    //     name: "Christmas Sale 2025",
    //     startDate: "2025-12-01T00:00:00+08:00",
    //     endDate: "2025-12-31T23:59:59+08:00",
    //     discountPercentage: 15 // 15% off all products
    // },
    // {
    //     name: "New Year Flash Sale",
    //     startDate: "2026-01-01T00:00:00+08:00",
    //     endDate: "2026-01-05T23:59:59+08:00",
    //     discountPercentage: 20 // 20% off all products
    // }
];

// Helper function to get current time in Philippine timezone
function getCurrentPhilippineTime() {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Manila"}));
}

// Helper function to check if a promo is currently active
function getActivePromo() {
    const now = getCurrentPhilippineTime();
    const activePromos = PROMO_CONFIG.filter(promo => {
        const start = new Date(promo.startDate);
        const end = new Date(promo.endDate);
        return now >= start && now <= end;
    });
    // If multiple promos are active, return the latest one (last in array)
    return activePromos.length > 0 ? activePromos[activePromos.length - 1] : null;
}

// Helper function to calculate sale price based on discount percentage
function calculateSalePrice(basePrice, discountPercentage) {
    return Math.round(basePrice * (1 - discountPercentage / 100));
}

// Helper function to calculate original price from sale price (for display)
function calculateOriginalPrice(salePrice, discountPercentage) {
    return Math.round(salePrice / (1 - discountPercentage / 100));
}

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
        console.info(
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
            payment_method: "cod",
            quantity: 1,
            ...window.CSFORM_FORM.reduce((data, field) => {
                data[field.id] = "";
                return data;
            }, {}),
        },
        // Product list with base prices - sale prices are calculated automatically based on active promo
        get productList() {
            const activePromo = getActivePromo();
            const baseProducts = {
                "1-box": {
                    price: 185,
                    quantity: 1,
                    name: "1-box of MX3 Coffee Mix",
                    img: "./assets/mx3coffeefront_5000x.webp"
                },
                "6-boxes": {
                    price: 1176,
                    quantity: 6,
                    name: "6-boxes of MX3 Coffee Mix",
                    img: "./assets/6x-mx3-coffee-mix-box.png"
                },
                "mx3-capsule-blister-pack": {
                    price: 170,
                    quantity: 6,
                    name: "7-packs of MX3 Capsule Blister Pack",
                    img: "./assets/7x-mx3-capsule-bilster-pack.png"
                },
                "mx3-capsule-buy15-take1-free": {
                    price: 15150,
                    quantity: 1,
                    name: "1 MX3 Capsule buy 15 take 1 Free",
                    img: "./assets/capsulebuy15take1.jpg"
                },
                "mx3-capsule-w-coffee-gift-set": {
                    price: 1500,
                    quantity: 1,
                    name: "1 MX3 Capsule with Coffee Gift Set",
                    img: "./assets/MX3CapsulewithMX3CoffeeGiftSet_5000x.webp"
                },
                "1-kilo-pack-coffee-mix": {
                    price:  2175,
                    quantity: 1,
                    name: "1-Kilo Pack MX3 Coffee Mix",
                    img: "./assets/mx3coffeemix1kilo_5000x.webp"
                },
                "MX3-Plus-Capsule": {
                    price: 714,
                    quantity: 1,
                    name: "1 MX3 Plus Capsule",
                    img: "./assets/mx3plusfront_5000x.webp"
                },
                "mx3-capsule": {
                    price:  1575,
                    quantity: 1,
                    name: "1 MX3 Capsule",
                    img: "./assets/mx3 capsule.jpg"
                },
                "upsell-capsule-w-mx3-coffee-gift-set": {
                    price: 1500,
                    quantity: 1,
                    name: "1 MX3 Capsule with MX3 Coffee Gift Set",
                    img: "./assets/MX3CapsulewithMX3CoffeeGiftSet_5000x.webp"
                },
                "upsell-coffemix-buy11take1": {
                    price: 1958,
                    quantity: 1,
                    name: "1-box MX3 Plus",
                    img: "./assets/mx3coffeemix11_1_5000x.webp"
                },
                "upsell-blister-pack": {
                    price: 145,
                    quantity: 1,
                    name: "1 Capsule blister pack",
                    img: "./assets/cpasuleblisterpack.jpg"
                },
                "capsule_coffee": {
                    price: 1010,
                    quantity: 1,
                    name: "1 Box of MX3 Capsule + Free 1-box MX3 Coffee Mix",
                    img: "./assets/mx3capsule_coffeemix_5000x.webp"
                },
            };

            // Add sale prices if promo is active
            if (activePromo) {
                Object.keys(baseProducts).forEach(key => {
                    baseProducts[key].originalPrice = baseProducts[key].price;
                    baseProducts[key].salePrice = calculateSalePrice(baseProducts[key].price, activePromo.discountPercentage);
                    baseProducts[key].discountPercentage = activePromo.discountPercentage;
                    baseProducts[key].promoName = activePromo.name;
                    // Update price to sale price
                    baseProducts[key].price = baseProducts[key].salePrice;
                });
            }

            return baseProducts;
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
        get chosenProduct() {
            return this.productList?.[this.formData.bundle]?.name || null;
        },
        get chosenProductImage() {
            return this.productList?.[this.formData.bundle]?.img || "./assets/mx3coffeefront_400x.webp";
        },
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
            const requiredFields = [
                "firstName",
                "lastName",
                "phone",
                "zip-code",
                "streetAddress",
                "barangay",
                "city",
                "province",
            ];
            if (
                requiredFields.some(
                    (field) => !this.formData[field]
                ) ||
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
        // Add this function to determine upsell path
        getUpsellPath(bundle, isSecondLayer = false) {
            const upsellPaths = {
                // Primary product upsells
                "6-boxes": {
                    primary: "./upsell-blister-pack.html",
                    secondary: "./upsell-mx3plus.html"
                },
                "1-kilo-pack-coffee-mix": {
                    primary: "./upsell-blister-pack.html",
                    secondary: "./upsell-mx3-coffee.html",
                },
                "mx3-capsule-blister-pack": {
                    primary: "./upsell-mx3-coffee.html",
                    secondary: "./upsell-mx3plus.html"
                },
                "mx3-capsule-buy15-take1-free": {
                    primary: "./upsell-mx3-coffee.html",
                    secondary: "./upsell-blister-pack.html",
                },
                "mx3-capsule-w-coffee-gift-set": {
                    primary: "./upsell-mx3-coffee.html",
                    secondary: "./upsell-blister-pack.html",
                },
                "1-kilo-pack-coffee-mix": {
                    primary: "./upsell-blister-pack.html",
                    secondary: "./upsell-mx3-coffee.html",
                },
                "MX3-Plus-Capsule": {
                    primary: "./upsell-mx3-coffee.html",
                    secondary: "./upsell-blister-pack.html",
                },
                "mx3-capsule": {
                    primary: "./upsell-mx3-coffee.html",
                    secondary: "./upsell-blister-pack.html"
                },
                "capsule_coffee": {
                    primary: "./upsell-mx3-coffee.html",
                    secondary: "./upsell-blister-pack.html"
                }
            };

            const path = upsellPaths[bundle];
            if (!path) return null;

            return isSecondLayer ? path.secondary : path.primary;
        },

        // Modified finalizeSubmission function
        async finalizeSubmission() {
            this.isLoading = true;
            await Promise.all([
                this.reportConversion("InitiateCheckout"),
                this.reportConversion("CompleteRegistration"),
                this.reportConversion("Lead"),
            ]);
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
                    order: this.chosenProduct || this.formData.order,
                    total: this.totalPayable,
                    type: "checkout",
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
                senderId: this.config.senderId,
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

                        // Get upsell path based on bundle
                        const upsellPath = this.getUpsellPath(this.formData.bundle);

                        if (upsellPath) {
                            const params = new URLSearchParams({
                                ...this.formData,
                                verificationToken: this.otpValidationToken,
                                originalBundle: this.formData.bundle // Track original purchase
                            });
                            window.location.href = upsellPath + "?" + params.toString();
                        } else {
                            // No upsell available, go to thank you
                            window.location.href = "./thankyou.html";
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

        // Modified submitUpsell function
        async submitUpsell({ upsellProduct, upsellAmount }) {
            try {
                console.log({ upsellProduct, upsellAmount });

                // Get URL parameters
                const urlParams = new URLSearchParams(window.location.search);

                // Keep track of original order information
                for (const [key, value] of urlParams) {
                    this.formData[key] = value;
                }

                // Track purchase event for upsell
                if (window.fbq) {
                    window.fbq('track', 'Purchase', {
                        content_name: upsellProduct,
                        content_type: 'product',
                        value: upsellAmount,
                        currency: 'PHP'
                    });
                }

                // Show loading spinner
                const loader = document.getElementById("loader");
                if (loader) loader.style.display = "flex";

                // Report conversion
                await this.reportConversion("Purchase");

                // Prepare API call
                const myHeaders = new Headers();
                myHeaders.append("Content-Type", "application/json");

                // Get URL parameters
                const allQueryParams = new URLSearchParams(window.location.search);
                const allQueryParamsJson = {};
                for (const [key, value] of allQueryParams) {
                    allQueryParamsJson[key] = value;
                }

                const verificationToken = this.formData.verificationToken;
                delete this.formData.verificationToken;

                const raw = JSON.stringify({
                    data: {
                        ...this.formData,
                        order: upsellProduct,
                        quantity: 1,
                        total: upsellAmount,
                        type: "upsell",
                    },
                    conversionApi: this.buildPayload("Purchase"),
                    metaPixelId: this.config.metaPixelId,
                    conversionApiToken: this.config.conversionApiToken,
                    verificationToken: verificationToken,
                    params: allQueryParamsJson,
                    sheet_id: this.config.sheet_id,
                    sheet_name: this.config.sheet_name,
                    businessEmail: this.config.businessEmail,
                    businessPhone: this.config.businessPhone,
                    businessName: this.config.businessName,
                    senderId: this.config.senderId,
                });

                const requestOptions = {
                    method: "POST",
                    headers: myHeaders,
                    body: raw,
                    redirect: "follow",
                };

                // Submit form
                return fetch(this.config.apiHost + "/cform_handle_submit", requestOptions)
                    .then((response) => response.json())
                    .then((data) => {
                        console.log("Upsell response:", data);
                        if (loader) loader.style.display = "none";

                        if (data.status) {
                            // Check for second layer upsell
                            const originalBundle = this.formData.originalBundle;
                            const secondLayerPath = this.getUpsellPath(originalBundle, true);

                            // Track if this is already a second layer upsell
                            const isSecondLayerUpsell = urlParams.has('secondLayer');

                            if (secondLayerPath && !isSecondLayerUpsell) {
                                // Go to second layer upsell
                                const params = new URLSearchParams({
                                    ...this.formData,
                                    verificationToken: verificationToken,
                                    secondLayer: 'true'
                                });
                                window.location.href = secondLayerPath + "?" + params.toString();
                            } else {
                                // No more upsells, go to thank you
                                window.location.href = "./thankyou.html?added=true";
                            }
                        } else {
                            // Error but still redirect
                            window.location.href = "./thankyou.html?added=false";
                        }
                        return data;
                    })
                    .catch((error) => {
                        console.error("Error submitting upsell:", error);
                        if (loader) loader.style.display = "none";
                        // Redirect anyway
                        window.location.href = "./thankyou.html?added=true";
                    });
            } catch (error) {
                console.error("Upsell error:", error);
                // Redirect to thank you page even if error
                window.location.href = "./thankyou.html?added=true";
            }
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
                this.isBarangaySearchLoading = true;
                this.showBarangayDropdown = true;
                this.initMeiliSearch().search(this.formData.barangay).then((res) => {
                    // Remove duplicates by city name
                    const uniqueBarangays = [];
                    const barangayNames = new Set();

                    res.hits.forEach(hit => {
                        if (!barangayNames.has(hit.brgy)) {
                            barangayNames.add(hit.brgy);
                            uniqueBarangays.push(hit);
                        }
                    });

                    this.barangays = uniqueBarangays;
                    this.isBarangaySearchLoading = false;
                    // Initialize or update Popper after results are loaded
                    this.$nextTick(() => {
                        this.initPopper('barangay');
                    });
                }).catch(err => {
                    console.error('Error searching barangays:', err);
                    this.isBarangaySearchLoading = false;
                });
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
                            uniqueCities.push(hit);
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
                            uniqueProvinces.push(hit);
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
            this.formData.city = city.city_municipality;
            this.formData.province = city.province || city.region;
            this.showCityDropdown = false;
            const event = new CustomEvent('city-selected', {
                detail: { city: city }
            });
            document.dispatchEvent(event);
        },
        selectProvince(province) {
            this.formData.province = province.province || province.region;
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
        getQueryParamValue(key) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(key);
        },
        mounted() {
            this.globalEventId = Math.random().toString(36).substring(2, 15);
            if (localStorage.getItem("formData")) {
                this.formData = { ...this.formData, ...JSON.parse(localStorage.getItem("formData")) };
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
            const urlParams = new URLSearchParams(window.location.search);
            for (const [key, value] of urlParams) {
                this.formData[key] = value;
            }
        },
    }).mount("#app");
});