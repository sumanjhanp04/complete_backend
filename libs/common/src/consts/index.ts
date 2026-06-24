// ========================================
// Calendar User Types
// Used in Calendar Module to identify
// which type of users an event belongs to.
// ========================================
export const CALENDER_USER_TYPE = {
  // Event assigned to Employees
  EMPLOYEES: 'EMPLOYEES',

  // Event assigned to Clients
  CLIENTS: 'CLIENTS',

  // Event assigned to selected users only
  SPECIFIC: 'SPECIFIC',

  // Event related to work shifts
  SHIFT: 'SHIFT',
};

// ========================================
// Notification Status
// Used in Notification Module
// ========================================
export const NOTIFICATION_STATUS = {
  // Notification not opened yet
  UNREAD: 'unread',

  // Notification already viewed
  READ: 'read',

  // Notification dismissed/removed
  DISMISSED: 'dismissed',

  // Real-time notification
  REALTIME: 'realtime',
};

// ========================================
// Toast Message Types
// Used in Frontend Notifications
// ========================================
export const ToastStatus = {
  // Error message
  ERROR: 'error',

  // Success message
  SUCCESS: 'success',

  // Warning message
  WARNING: 'warning',

  // Information message
  INFO: 'info',
};

// ========================================
// MongoDB Populate Fields
// When populating User document,
// only these fields will be returned.
// ========================================
export const USER_POPULATION_FIELDS = 'firstName lastName image gender';

// ========================================
// Task Field Names
// Used for activity logs,
// audit logs and task updates.
// ========================================
export const TASK_FIELD_NAME = {
  NAME: {
    NAME: 'Name',
    FIELD: 'name',
  },

  DESCRIPTION: {
    NAME: 'Description',
    FIELD: 'description',
  },

  START_DATE: {
    NAME: 'Start Date',
    FIELD: 'startDate',
  },

  END_DATE: {
    NAME: 'End Date',
    FIELD: 'endDate',
  },

  PRIORITY: {
    NAME: 'Priority',
    FIELD: 'priority',
  },

  ASSIGNED_USER: {
    NAME: 'Assigned Users',
    FIELD: 'assignedUser',
  },

  TAGS: {
    NAME: 'Tags',
    FIELD: 'tags',
  },
};

// ========================================
// Allowed Excel File Types
// Used during file upload validation
// ========================================
export const EXCEL_FILE_TYPE = [
  // Old Excel format (.xls)
  'application/vnd.ms-excel',

  // Excel Open XML (.xlsx)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  // Macro enabled Excel file
  'application/vnd.ms-excel.sheet.macroEnabled.12',

  // Binary Excel workbook
  'application/vnd.ms-excel.sheet.binary.macroEnabled.12',

  // Excel format
  'application/vnd.ms-excel',

  // Excel template
  'application/vnd.openxmlformats-officedocument.spreadsheetml.template',

  // Macro enabled template
  'application/vnd.ms-excel.template.macroEnabled.12',

  // Excel format
  'application/vnd.ms-excel',

  // CSV file
  'text/csv',

  // OpenDocument Spreadsheet (.ods)
  'application/vnd.oasis.opendocument.spreadsheet',
];

// ========================================
// Allowed Image File Types
// Used during image upload validation
// ========================================
export const IMAGE_FILE_TYPE = [
  // JPEG Image
  'image/jpeg',

  // JPEG Image
  'image/jpeg',

  // PNG Image
  'image/png',

  // GIF Image
  'image/gif',

  // WEBP Image
  'image/webp',

  // SVG Image
  'image/svg+xml',

  // BMP Image
  'image/bmp',

  // RAW Camera Formats
  'image/x-canon-cr2',
  'image/x-nikon-nef',
  'image/x-adobe-dng',
  'image/x-sony-arw',
  'image/x-sony-sr2',
  'image/x-fuji-raf',

  // Icon Formats
  'image/x-icon',
  'image/x-icns',

  // TIFF Images
  'image/tiff',
  'image/tiff',

  // Photoshop File
  'image/vnd.adobe.photoshop',

  // EPS / PostScript
  'application/postscript',
  'application/postscript',
];

// ========================================
// Allowed Video File Types
// Used during video upload validation
// ========================================
export const VIDEO_FILE_TYPE = [
  // MP4 Video
  'video/mp4',

  // WebM Video
  'video/webm',

  // OGG Video
  'video/ogg',

  // MPEG Video
  'video/mpeg',

  // MOV (QuickTime)
  'video/quicktime',

  // Apple M4V
  'video/x-m4v',

  // AVI
  'video/x-msvideo',

  // WMV
  'video/x-ms-wmv',

  // Flash Video
  'video/x-flv',

  // 3GP
  'video/3gpp',

  // 3GPP2
  'video/3gpp2',

  // MKV
  'video/x-matroska',

  // MPEG Transport Stream
  'video/mp2t',
  'video/mp2t',
  'video/mp2t',

  // DVD VOB File
  'video/x-ms-vob',
];

// ========================================
// Maximum Allowed Video Size
// 200 MB
// ========================================
export const MAX_VIDEO_FILE_SIZE_ALLOWED = 1024 * 1024 * 200;

// ========================================
// Maximum Allowed Other File Size
// 50 MB
// ========================================
export const MAX_OTHER_FILE_SIZE_ALLOWED = 1024 * 1024 * 50;

// ========================================
// Allowed Audio File Types
// Used during audio upload validation
// ========================================
export const AUDIO_FILE_TYPE = [
  // MP3
  'audio/mpeg',

  // OGG
  'audio/ogg',

  // WAV
  'audio/wav',

  // AAC
  'audio/aac',

  // MP4 Audio
  'audio/mp4',

  // WebM Audio
  'audio/webm',

  // FLAC
  'audio/flac',

  // Legacy Audio Formats
  'audio/midi',
  'audio/midi',
  'audio/midi',
  'audio/amr',
  'audio/basic',
  'audio/basic',

  // Professional Audio Formats
  'audio/aiff',
  'audio/aiff',
  'audio/aiff',
  'audio/opus',
  'audio/xm',
  'audio/mod',
  'audio/s3m',

  // Voice / Telephony Formats
  'audio/voxware',
  'audio/x-realaudio',
  'audio/x-pn-realaudio',

  // Apple Audio Formats
  'audio/x-caf',
  'audio/x-m4r',
];

// ========================================
// Allowed PDF File Types
// Used during PDF upload validation
// ========================================
export const PDF_FILE_TYPE = [
  // PDF Document
  'application/pdf',
];
