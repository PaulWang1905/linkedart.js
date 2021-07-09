/**
 * @file LanguageHelpers
 * @author Adam Brin, Pamela Lam, Alyx Rossetti, Charles Webb, Selina Zawacki
 * @module LanguageHelpers
 * @description This class contains helpers for working with Languages in Linked.art
 */

export const DEFAULT_LANGUAGE_LOOKUP = {
  en: "http://vocab.getty.edu/aat/300388277",
  es: "http://vocab.getty.edu/aat/300389311",
  fr: "http://vocab.getty.edu/aat/300388306",
};

export const NO_LANGUAGE = "NO_LANGUAGE";

/**
 * Checks whether the object matches the language specified in it's language declaration
 *
 * True cases:
 * 1. if language is undefined, return true
 * 2. if the language parameter matches the language of the object, return true
 * 3. if the language parameter doesn't match the language of the object the, but the
 *   languageOptions.fallbackLanguage parameter matches the language of the object, return true
 * 4. if the language of the object is not defined and languageOptions.includeItemsWithNoLanguage
 *   is true, return true
 *
 * @param {object} object -- the object to check for a matching language
 * @param {string} language -- limits the results to just a specific language (or leave undefined to match all objects)
 * @param {object} languageOptions -- optional object with expected attributes 'fallbackLanguage',
 *   'includeItemsWithNoLanguage', and 'lookupMap' (see normalizeLanguageId)
 *
 * @example object without a 'language' attribute
 * doesObjectLanguageMatch({id:"1",content:"test"},"en") would return true
 *
 * @example object without a 'language' attribute and with languageOptions.includeItemsWithNoLanguage == false
 * doesObjectLanguageMatch({id:"1",content:"test"},"en",{includeItemsWithNoLanguage:false}) would return false
 *
 * @example with languageOptions.lookupMap
 * doesObjectLanguageMatch({id:"1",content:"test",language:"fr"},"en",{lookupMap:{fr: "en"}}) would return true
 *
 * @example with languageOptions.fallbackLanguage
 * doesObjectLanguageMatch({id:"1",content:"test",language:"fr"},"en",{fallbackLanguage:'fr'}) would return true
 *
 * @returns {boolean}
 */
export function doesObjectLanguageMatch(
  object,
  language,
  languageOptions = {}
) {
  // If the language parameter is undefined, return true
  if (language == undefined) {
    return true;
  }
  // Get the normalized LANGUAGE_IDs for the result
  let lang_ids = getLanguageId(object, languageOptions);

  // if the languageId matches the specified language
  if (lang_ids.includes(normalizeLanguageId(language, languageOptions))) {
    return true;
  }

  // handle fallback for language
  if (
    languageOptions.fallbackLanguage != undefined &&
    lang_ids.includes(
      normalizeLanguageId(languageOptions.fallbackLanguage, languageOptions)
    )
  ) {
    return true;
  }

  // if the languageId matches "no language" or there are no languages
  if (lang_ids.includes(NO_LANGUAGE) || lang_ids.length == 0) {
    if (languageOptions.includeItemsWithNoLanguage == false) {
      return false;
    }

    return true;
  }

  return false;
}

/**
 * Get the LanguageId(s) for a given object and returns the unique list of languages (normalized)
 *
 * @param {object} obj -- the object to look for the language block in
 * @param {object} languageOptions -- any additional options when working with language(s)
 *
 * @example object with a string value in its 'language' attribute and no languageOptions
 * getLanguageId({language: 'en'}) would return "http://vocab.getty.edu/aat/300388277"
 *
 * @example object with an object in its 'language' attribute and languageOptions.lookupMap defined
 * getLanguageId({language: {id: 'http://vocab.getty.edu/language/en'}}, {lookupMap: {'en': 'fr'}})
 * would return 'fr'
 *
 * @example object without a 'language' attribute and languageOptions.lookupMap defined
 * getLanguageId({}, {lookupMap: {'en': 'fr'}}) would return "NO_LANGUAGE"
 *
 * @returns {array} the unique list of languages represented in the data
 */
export function getLanguageId(obj, languageOptions) {
  if (obj == undefined || obj.language == undefined) {
    return [NO_LANGUAGE];
  }
  if (typeof obj.language === "string") {
    return [normalizeLanguageId(obj.language, languageOptions)];
  }
  let toReturn = new Set();

  // if we have an array, get all of the values
  obj.language.forEach((lang) => {
    if (lang == undefined) {
      toReturn.add(NO_LANGUAGE);
    } else if (typeof lang === "string") {
      toReturn.add(lang);
    } else if (lang.id) {
      toReturn.add(lang.id);
    }
  });

  // convert the set to an array and then normalize the results
  toReturn = Array.from(toReturn).map((item) =>
    normalizeLanguageId(item, languageOptions)
  );

  return toReturn;
}

/**
 * Normalize a language id string to the corresponding AAT ID defined in the
 * DEFAULT_LANGUAGE_LOOKUP or to something else defined by languageOptions.lookupMap
 *
 * Algorithm summary:
 * 1. simplifies an AAT language code or other URL ending in ISO code (e.g. http://vocab.getty.edu/language/en)
 * to just the ISO code (2 letter) (e.g. en) before checking for that code in the lookupMap.
 * 2. if the simplified lang_id param can't be found in the lookupMap, returns the original lang_id
 *
 * @param {string} lang_id -- the language id to normalize
 * @param {object} languageOptions -- any additional options when working with language(s)
 *
 * @example AAT language code URL
 * normalizeLanguageId('http://vocab.getty.edu/language/en') would return "http://vocab.getty.edu/aat/300388277"
 *
 * @example ISO code in DEFAULT_LANGUAGE_LOOKUP
 * normalizeLanguageId('en') would return "http://vocab.getty.edu/aat/300388277"
 *
 * @example ISO code in languageOptions.lookupMap
 * normalizeLanguageId('en', {lookupMap: {'el': 'greek'}}) would return "greek"
 *
 * @returns {string} the normalized version of the language (by default, an AAT URL), or if no match,
 * reverts to the original lang_id parameter
 */
export function normalizeLanguageId(lang_id, languageOptions) {
  if (lang_id == undefined) {
    return NO_LANGUAGE;
  }

  let lookupMap = DEFAULT_LANGUAGE_LOOKUP;
  // if there's a custom lookup map, use that, otherwise use the default
  if (languageOptions && languageOptions.lookupMap) {
    lookupMap = languageOptions.lookupMap;
  }

  // if we have a vocab url, grab just the end of it
  let lang = lang_id.toLowerCase();

  // (ends with /en , e.g.)
  if (lang.match(/\/[a-zA-Z]+$/)) {
    lang = lang.substring(lang.lastIndexOf("/") + 1);
  }

  // if the lookup map contains the language, return the result (which should be an AAT ID)
  let lookup = lookupMap[lang];
  if (lookup != undefined) {
    return lookup;
  }

  // return what was sent
  return lang_id;
}
