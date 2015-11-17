const env = process.env.NODE_ENV || "development";

const urls = {
    // Generate a URL given a path and a locale
    gen(locale, path) {
        const base = locale === "en" || !locale || env === "development" ?
            urls.base() :
            urls.base().replace("://", `://${locale}.`);

        // Only use a query string in dev mode and if we're
        // on a non-default locale
        if (env === "development" && locale !== app.locales[0]) {
            path += `${/\?/.test(path) ? "&" : "?"}lang=${locale}`;
        }

        return base + path;
    },

    // The base URL for all pages
    base() {
        return process.env.BASE_URL ||
            `http://localhost:${process.env.PORT}`;
    },

    // The base URL for storage
    baseData() {
        return process.env.BASE_DATA_URL ||
            `http://localhost:${process.env.PORT}`;
    },

    // Generate a data URL
    data(source, type) {
        return `${urls.baseData()}${source}/${type || ""}`;
    }
};

module.exports = (lib) => urls;