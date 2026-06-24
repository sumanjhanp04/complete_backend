// Import moment.js for date and time calculations
import * as moment from 'moment';

// Import task field constants
import { TASK_FIELD_NAME } from '../consts';

// ======================================================
// Generate Random String
// Used for:
// - Temporary passwords
// - Verification codes
// - Random tokens
// ======================================================
export function generateRandomString(length = 10, secure = false) {
  // Uppercase letters
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Lowercase letters
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';

  // Numbers
  const digits = '0123456789';

  // Special characters
  const special = '!@#$%^&*()-_=+[]{}|;:,.<>?/';

  // Default character set
  let characters = uppercase + lowercase + digits;

  // If secure=true include special characters
  if (secure) {
    characters += special;
  }

  let password = '';

  // Generate random string
  for (let i = 0; i < length; i++) {
    // Pick random index
    const randomIndex = Math.floor(Math.random() * characters.length);

    // Add character to result
    password += characters[randomIndex];
  }

  return password;
}

// ======================================================
// Extract File Extension From Base64 String
// Example:
// data:image/jpeg;base64,ABCDEF...
//
// Returns:
// jpeg
// ======================================================
export function extractFileExtensionFromBase64(base64String) {
  // Split metadata and actual data
  const parts = base64String.split(',');

  if (parts.length === 2) {
    // Example:
    // data:image/jpeg;base64
    const metadataPrefix = parts[0];

    // Extract MIME type
    // image/jpeg
    const contentType = metadataPrefix.split(';')[0].split(':')[1];

    // Extract extension
    // jpeg
    const fileExtension = contentType.split('/')[1];

    return fileExtension;
  }

  // Invalid Base64 format
  return null;
}

// ======================================================
// Demo Delay
// Artificial delay for testing/demo purposes
//
// Example:
// await demoDelay(5000)
// Waits 5 seconds
// ======================================================
export const demoDelay = async (duration: number = 3000) => {
  return new Promise((resolve) =>
    setTimeout(() => resolve('demo delay finished'), duration),
  );
};

// ======================================================
// MongoDB Populate Helper
//
// Used for:
//
// .populate(getUserPopulationFields())
//
// Returns:
// {
//   path,
//   select,
//   populate
// }
// ======================================================
export const getUserPopulationFields = (fields) => {
  return {
    // Fields to populate
    path: fields ?? 'createdBy updatedBy',

    // Select only these fields
    select: 'userId userIdRef',

    // Nested populate
    populate: {
      path: 'userId',

      select: 'firstName lastName image gender',
    },
  };
};

// ======================================================
// Convert Field Name To Human Readable Name
//
// Example:
// findFieldName('startDate')
//
// Returns:
// "Start Date"
// ======================================================
export function findFieldName(fieldName, name = null) {
  // Loop through TASK_FIELD_NAME object
  for (const category in TASK_FIELD_NAME) {
    const field = TASK_FIELD_NAME[category];

    // Match field
    if (field.FIELD === fieldName) {
      return field.NAME;
    }
  }

  return null;
}

// ======================================================
// Flatten Nested Object
//
// Example:
//
// {
//   user:{
//      name:"Suman"
//   }
// }
//
// Returns:
//
// {
//   user_name:"Suman"
// }
// ======================================================
export function flattenObject(obj, parentKey = '') {
  // Safety check
  if (obj === null || typeof obj !== 'object') {
    return {};
  }

  return Object.keys(obj).reduce((acc, key) => {
    // Create flattened key
    const newKey = parentKey ? `${parentKey}_${key}` : key;

    // Keep arrays as they are
    if (Array.isArray(obj[key])) {
      acc[newKey] = obj[key];
    }

    // Recursively flatten nested objects
    else if (typeof obj[key] === 'object' && obj[key] !== null) {
      Object.assign(acc, flattenObject(obj[key], newKey));
    }

    // Store primitive values
    else {
      acc[newKey] = String(obj[key]).trim();
    }

    return acc;
  }, {});
}

// ======================================================
// Add Ordinal Suffix
//
// Example:
// 1 -> 1st
// 2 -> 2nd
// 3 -> 3rd
// 4 -> 4th
// ======================================================
export const getOrdinalSuffix = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];

  const v = n % 100;

  // Special case:
  // 11th, 12th, 13th
  if (v >= 11 && v <= 13) {
    return n + s[0];
  }

  return n + (s[n % 10] || s[0]);
};

// ======================================================
// Calculate Total Break Time
//
// Input:
//
// [
//   {
//      createdAt,
//      endTime
//   }
// ]
//
// Output:
//
// {
//   totalDurationInSeconds
// }
// ======================================================
export function getTotalBreakTimes(data: any[]) {
  let totalDurationInSeconds = 0;

  data?.map((item) => {
    // Start time
    const start = moment(item?.createdAt);

    // End time
    const end = item?.endTime ? moment(item?.endTime) : moment();

    // Duration
    const duration = moment.duration(end.diff(start));

    // Add seconds
    totalDurationInSeconds += Math.round(duration.asSeconds());
  });

  return {
    totalDurationInSeconds: totalDurationInSeconds ?? 0,
  };
}

// ======================================================
// Calculate Processing Time
//
// Used to estimate processing time
// based on file size.
//
// 1 MB  -> 5 Minutes
// 1 GB  -> 5 Hours
// ======================================================
export function calculateProcessingTime(fileSizeBytes) {
  // 1 MB
  const size1MB = 1048576;

  // 1 GB
  const size1GB = 1073741824;

  // 5 minutes
  const time1MB = 300;

  // 5 hours
  const time1GB = 18000;

  // Small file
  if (fileSizeBytes <= size1MB) {
    return time1MB;
  }

  // Exponential scaling factor
  const b = Math.log(time1GB / time1MB) / Math.log(size1GB / size1MB);

  // Constant factor
  const a = time1MB / Math.pow(size1MB, b);

  // Estimated processing time
  const timeSeconds = a * Math.pow(fileSizeBytes, b);

  return timeSeconds;
}
