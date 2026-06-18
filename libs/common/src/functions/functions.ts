import * as moment from 'moment';
import { TASK_FIELD_NAME } from '../consts';

export function generateRandomString(length = 10, secure = false) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()-_=+[]{}|;:,.<>?/';

  let characters = uppercase + lowercase + digits;

  if (secure) {
    characters += special;
  }
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters[randomIndex];
  }

  return password;
}

export function extractFileExtensionFromBase64(base64String) {
  // Split the base64 string by a comma to separate the metadata prefix and the data
  const parts = base64String.split(',');

  if (parts.length === 2) {
    // Extract the metadata prefix (e.g., 'data:image/jpeg;base64,')
    const metadataPrefix = parts[0];

    // Parse the content type from the metadata prefix (e.g., 'image/jpeg')
    const contentType = metadataPrefix.split(';')[0].split(':')[1];

    // Use the content type to determine the file extension
    const fileExtension = contentType.split('/')[1];

    return fileExtension;
  }

  // If the base64 string does not follow the expected format, return null or handle it as needed.
  return null;
}

export const demoDelay = async (duration: number = 3000) => {
  return new Promise((resolve) =>
    setTimeout(() => resolve('demo delay finished'), duration),
  );
};

export const getUserPopulationFields = (fields) => {
  return {
    path: fields ?? 'createdBy updatedBy',
    select: 'userId userIdRef',
    populate: {
      path: 'userId',
      select: 'firstName lastName image gender',
    },
  };
};



export function findFieldName(fieldName, name = null) {
  for (const category in TASK_FIELD_NAME) {
    const field = TASK_FIELD_NAME[category];

    if (field.FIELD === fieldName) {
      return field.NAME;
    }
  }
  return null;
}

export function flattenObject(obj, parentKey = '') {
  if (obj === null || typeof obj !== 'object') {
    return {};
  }

  return Object.keys(obj).reduce((acc, key) => {
    const newKey = parentKey ? `${parentKey}_${key}` : key;

    if (Array.isArray(obj[key])) {
      // Retain the array without flattening
      acc[newKey] = obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      // Recursively flatten only objects, not arrays
      Object.assign(acc, flattenObject(obj[key], newKey));
    } else {
      // For non-object and non-array values, store them as strings
      acc[newKey] = String(obj[key]).trim();
    }

    return acc;
  }, {});
}

export const getOrdinalSuffix=(n: number)=>{
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  //console.log.log(n, s[n % 10]);
  if (v >= 11 && v <= 13) {
    return n + s[0];
  }
  return n + (s[n % 10] || s[0]);
}

export function getTotalBreakTimes(data: any[]) {
  let totalDurationInSeconds = 0;

  // Calculate duration for each object
  data?.map((item) => {
      const start = moment(item?.createdAt);
      const end = item?.endTime ? moment(item?.endTime) : moment();
      const duration = moment.duration(end.diff(start));
      // // Convert duration to seconds
      totalDurationInSeconds += Math.round(duration.asSeconds());
  });  
  return {
      
      totalDurationInSeconds: totalDurationInSeconds ?? 0,
  };
}

export function calculateProcessingTime(fileSizeBytes) {
    const size1MB = 1048576;      // 1 MB in bytes (1024 * 1024)
    const size1GB = 1073741824;   // 1 GB in bytes (1024 * 1024 * 1024)
    const time1MB = 300;          // 5 minutes in seconds (5 * 60)
    const time1GB = 18000;        // 5 hours in seconds (5 * 60 * 60)

    if(fileSizeBytes<= size1MB){
        return time1MB;
    }

    // Calculate exponent 'b'
    const b = Math.log(time1GB / time1MB) / Math.log(size1GB / size1MB);

    // Calculate scaling factor 'a'
    const a = time1MB / Math.pow(size1MB, b);

    // Compute time in seconds
    const timeSeconds = a * Math.pow(fileSizeBytes, b);

    return timeSeconds;
}