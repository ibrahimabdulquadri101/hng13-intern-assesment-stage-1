import crypto from "crypto";
import StringAnalysis from "../model/string.model.js";

function isPalindrome(str) {
  const processedStr = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  const reversedStr = processedStr.split("").reverse().join("");
  return processedStr === reversedStr;
}

function countUniqueChars(text) {
  return new Set([...text]).size;
}

function wordCount(str) {
  const matches = str.trim().match(/\b\w+\b/g);
  return matches ? matches.length : 0;
}

function sha256String(str) {
  return crypto.createHash("sha256").update(str, "utf8").digest("hex");
}

function createFrequencyMap(text) {
  const frequencyMap = {};
  for (const char of text) {
    frequencyMap[char] = (frequencyMap[char] || 0) + 1;
  }
  return frequencyMap;
}
export const analyzeString = async (req, res) => {
  try {
    const { value } = req.body;
    if (!value) {
      return res
        .status(400)
        .json({ message: "Invalid request body or missing value field" });
    }
    if (typeof value !== "string") {
      return res
        .status(422)
        .json({ message: "Invalid data type for value (must be string)" });
    }
    const sha256_hash = sha256String(value);
    const length = value.length;
    const is_palindrome = isPalindrome(value);
    const unique_characters = countUniqueChars(value);
    const word_count = wordCount(value);
    const character_frequency_map = createFrequencyMap(value);
    const created_at = new Date();

    const existingAnalysis = await StringAnalysis.findOne({ id: sha256_hash });

    if (existingAnalysis) {
      return res.status(409).json({
        message: "String already exists in the system",
        data: existingAnalysis,
      });
    }
    const newAnalysisData = {
      id: sha256_hash,
      value: value,
      properties: {
        length,
        is_palindrome,
        unique_characters,
        word_count,
        sha256_hash,
        character_frequency_map,
      },
      created_at: created_at,
    };
    const response = await StringAnalysis.create(newAnalysisData);
    res.status(201).json({
      id: response.id,
      value: response.value,
      properties: response.properties,
      created_at: response.created_at,
    });
  } catch (error) {
    console.error("Analysis Error:", error);
    res.status(500).json({
      message: "An unexpected error occurred during string analysis.",
      error: error.message,
    });
  }
};

export const getSpecificStrings = async (req, res) => {
  try {
    const string = sha256String(req.params.id);
    const response = await StringAnalysis.findOne({ id: string }, { _id: 0 });
    if (!response) {
      return res.status(404).json({
        message: "String does not exist in the system.",
      });
    }
    res.status(200).json(response);
  } catch (error) {
    console.error("Error retrieving specific string:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getAllStrings = async (req, res) => {
  const {
    is_palindrome,
    min_length,
    max_length,
    word_count,
    contains_character,
  } = req.query;

  const mongoFilter = {};
  const filtersApplied = {};

  try {
    if (is_palindrome !== undefined) {
      const isPalindromeBool = is_palindrome === "true";
      if (is_palindrome !== "true" && is_palindrome !== "false") {
        return res.status(400).json({
          message:
            "Invalid value for 'is_palindrome'. Must be 'true' or 'false'.",
        });
      }
      mongoFilter["properties.is_palindrome"] = isPalindromeBool;
      filtersApplied.is_palindrome = isPalindromeBool;
    }

    const minLengthInt = parseInt(min_length, 10);
    const maxLengthInt = parseInt(max_length, 10);

    if (!isNaN(minLengthInt) && minLengthInt >= 0) {
      mongoFilter["properties.length"] = {
        ...mongoFilter["properties.length"],
        $gte: minLengthInt,
      };
      filtersApplied.min_length = minLengthInt;
    } else if (min_length !== undefined) {
      return res.status(400).json({
        message:
          "Invalid value for 'min_length'. Must be a non-negative integer.",
      });
    }

    if (!isNaN(maxLengthInt) && maxLengthInt >= 0) {
      mongoFilter["properties.length"] = {
        ...mongoFilter["properties.length"],
        $lte: maxLengthInt,
      };
      filtersApplied.max_length = maxLengthInt;
    } else if (max_length !== undefined) {
      return res.status(400).json({
        message:
          "Invalid value for 'max_length'. Must be a non-negative integer.",
      });
    }

    const wordCountInt = parseInt(word_count, 10);
    if (!isNaN(wordCountInt) && wordCountInt >= 0) {
      mongoFilter["properties.word_count"] = wordCountInt;
      filtersApplied.word_count = wordCountInt;
    } else if (word_count !== undefined) {
      return res.status(400).json({
        message:
          "Invalid value for 'word_count'. Must be a non-negative integer.",
      });
    }
    if (contains_character !== undefined) {
      if (
        typeof contains_character !== "string" ||
        contains_character.length === 0
      ) {
        return res.status(400).json({
          message:
            "Invalid value for 'contains_character'. Must be a single character string.",
        });
      }
      mongoFilter[`properties.character_frequency_map.${contains_character}`] =
        { $exists: true };
      filtersApplied.contains_character = contains_character;
    }
    const data = await StringAnalysis.find(mongoFilter).exec();
    const count = await StringAnalysis.countDocuments(mongoFilter).exec();
    res.status(200).json({
      data: data,
      count: count,
      filters_applied: filtersApplied,
    });
  } catch (error) {
    console.error("Error during filtered string retrieval:", error);
    res.status(500).json({
      message: "An internal server error occurred.",
      error: error.message,
    });
  }
};
const applyParsedFilters = (parsedFilters, mongoFilter) => {
  if (parsedFilters.is_palindrome !== undefined) {
    mongoFilter["properties.is_palindrome"] = parsedFilters.is_palindrome;
  }

  if (parsedFilters.word_count !== undefined) {
    mongoFilter["properties.word_count"] = parsedFilters.word_count;
  }

  if (parsedFilters.min_length !== undefined) {
    mongoFilter["properties.length"] = {
      ...mongoFilter["properties.length"],
      $gte: parsedFilters.min_length,
    };
  }
  if (parsedFilters.max_length !== undefined) {
    mongoFilter["properties.length"] = {
      ...mongoFilter["properties.length"],
      $lte: parsedFilters.max_length,
    };
  }

  if (parsedFilters.contains_character) {
    const char = parsedFilters.contains_character;
    mongoFilter[`properties.character_frequency_map.${char}`] = {
      $exists: true,
    };
  }

  return mongoFilter;
};

export const filterByNaturalLanguage = async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res
      .status(400)
      .json({ message: "Query parameter 'query' is required." });
  }

  const originalQuery = query;
  const lowerQuery = query.toLowerCase();
  const parsedFilters = {};
  const mongoFilter = {};
  if (lowerQuery.includes("palindromic") || lowerQuery.includes("palindrome")) {
    parsedFilters.is_palindrome = true;
  }

  if (lowerQuery.includes("single word") || lowerQuery.includes("one word")) {
    parsedFilters.word_count = 1;
  }
  if (lowerQuery.includes("longer than")) {
    const match = lowerQuery.match(/longer than\s*(\d+)/);
    if (match) {
      parsedFilters.min_length = parseInt(match[1], 10) + 1;
    }
  } else if (lowerQuery.includes("shorter than")) {
    const match = lowerQuery.match(/shorter than\s*(\d+)/);
    if (match) {
      parsedFilters.max_length = parseInt(match[1], 10) - 1;
    }
  }

  if (
    lowerQuery.includes("contain") ||
    lowerQuery.includes("containing") ||
    lowerQuery.includes("contains")
  ) {
    let charMatch = lowerQuery.match(/the letter\s*([a-z])/);
    if (!charMatch && lowerQuery.includes("first vowel")) {
      charMatch = ["a", "a"];
    }

    if (charMatch) {
      parsedFilters.contains_character = charMatch[1].charAt(0);
    }
  }
  const filterCount = Object.keys(parsedFilters).length;

  if (filterCount === 0) {
    return res.status(400).json({
      message:
        "Unable to parse natural language query. Please try different wording or check spelling.",
    });
  }

  try {
    applyParsedFilters(parsedFilters, mongoFilter);

    const data = await StringAnalysis.find(mongoFilter).exec();
    const count = await StringAnalysis.countDocuments(mongoFilter).exec();
    res.status(200).json({
      data: data,
      count: count,
      interpreted_query: {
        original: originalQuery,
        parsed_filters: parsedFilters,
      },
    });
  } catch (dbError) {
    console.error("Database query error:", dbError);
    res.status(422).json({
      message:
        "Query parsed successfully but resulted in conflicting or unprocessable database filters.",
      error: dbError.message,
    });
  }
};
export const Delete = async (req, res) => {
  try {
    const string = sha256String(req.params.id);
    const result = await StringAnalysis.deleteOne({ id: string });
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({
          message: "String analysis for the provided content not found.",
        });
    }
    res.status(204).end();
  } catch (error) {
    console.error("Error during document deletion:", error);
    res.status(500).json({ message: "An internal error occurred." });
  }
};
