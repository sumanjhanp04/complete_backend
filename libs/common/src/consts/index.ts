export const CALENDER_USER_TYPE = {
    EMPLOYEES: 'EMPLOYEES',
    CLIENTS: 'CLIENTS',
    SPECIFIC: 'SPECIFIC',
    SHIFT:'SHIFT'
}

export const NOTIFICATION_STATUS = {
    UNREAD: 'unread',
    READ: 'read',
    DISMISSED: 'dismissed',
    REALTIME:'realtime'
}

export const ToastStatus = {
    ERROR : 'error',
    SUCCESS : 'success',
    WARNING : 'warning',
    INFO : 'info',
  }



export const USER_POPULATION_FIELDS = 'firstName lastName image gender'


export const TASK_FIELD_NAME={
    NAME:{
      NAME:'Name',
      FIELD:'name'
    },
    DESCRIPTION:{
      NAME:'Description',
      FIELD:'description'
    },
    START_DATE:{
      NAME:'Start Date',
      FIELD:'startDate'
    },
    END_DATE:{
      NAME:'End Date',
      FIELD:'endDate'
    },
    PRIORITY:{
      NAME:'Priority',
      FIELD:'priority'
    },
    ASSIGNED_USER:{
        NAME:'Assigned Users',
        FIELD:'assignedUser'
    },
    TAGS:{
        NAME:'Tags',
        FIELD:'tags'
    }
    
  }

export const EXCEL_FILE_TYPE = [
   'application/vnd.ms-excel',
   'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
   'application/vnd.ms-excel.sheet.macroEnabled.12',
   'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
   'application/vnd.ms-excel',
   'application/vnd.openxmlformats-officedocument.spreadsheetml.template',
   'application/vnd.ms-excel.template.macroEnabled.12',
   'application/vnd.ms-excel',
   'text/csv',
   'application/vnd.oasis.opendocument.spreadsheet'
]

export const IMAGE_FILE_TYPE= [
   'image/jpeg',
   'image/jpeg',
   'image/png',
   'image/gif',
   'image/webp',
   'image/svg+xml',
   'image/bmp',
  
   'image/x-canon-cr2',
   'image/x-nikon-nef',
   'image/x-adobe-dng',
   'image/x-sony-arw',
   'image/x-sony-sr2',
   'image/x-fuji-raf',
  
   'image/x-icon',
   'image/x-icns',
   'image/tiff',
   'image/tiff',
   'image/vnd.adobe.photoshop',
   'application/postscript',
   'application/postscript',
]

export const VIDEO_FILE_TYPE=[
    'video/mp4',
   'video/webm',
   'video/ogg',
   'video/mpeg',
   'video/quicktime',
   'video/x-m4v',
  'video/x-msvideo',
   'video/x-ms-wmv',
   'video/x-flv',
   'video/3gpp',
   'video/3gpp2',
   'video/x-matroska',
   'video/mp2t',
   'video/mp2t',
   'video/mp2t',
   'video/x-ms-vob',
]

export const MAX_VIDEO_FILE_SIZE_ALLOWED = 1024 * 1024 * 200; 
export const MAX_OTHER_FILE_SIZE_ALLOWED = 1024 * 1024 * 50; 

export const AUDIO_FILE_TYPE=[
   'audio/mpeg',
   'audio/ogg',
   'audio/wav',
   'audio/aac',
   'audio/mp4',
   'audio/webm',
   'audio/flac',
  
  // Legacy formats
   'audio/midi',
   'audio/midi',
   'audio/midi',
   'audio/amr',
   'audio/basic',
   'audio/basic',
  
  // Specialized formats
   'audio/aiff',
   'audio/aiff',
   'audio/aiff',
   'audio/opus',
   'audio/xm',
   'audio/mod',
   'audio/s3m',
  
  // Voice/telephony formats
   'audio/voxware',
   'audio/x-realaudio',
   'audio/x-pn-realaudio',
  
  // Apple formats
   'audio/x-caf',
   'audio/x-m4r',
]

export const PDF_FILE_TYPE=[
  "application/pdf"
]