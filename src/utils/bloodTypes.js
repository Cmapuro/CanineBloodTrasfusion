/**
 * Blood Types Utility
 * Contains blood type data and helper functions
 */

// Array of all valid blood types
export const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

export const CANINE_BLOOD_TYPES = [
  'DEA 1.1 Positive',
  'DEA 1.1 Negative',
  'DEA 1.2',
  'DEA 3',
  'DEA 4',
  'DEA 5',
  'DEA 7',
  'Dal',
  'Kai 1',
  'Kai 2',
];

// Blood type compatibility chart
// Key is the recipient blood type, value is array of compatible donor blood types
export const BLOOD_TYPE_COMPATIBILITY = {
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
};

/**
 * Get compatible donor blood types for a recipient
 * @param {string} recipientBloodType - Recipient's blood type
 * @returns {array} Array of compatible donor blood types
 */
export const getCompatibleDonors = (recipientBloodType) => {
  return BLOOD_TYPE_COMPATIBILITY[recipientBloodType] || [];
};

/**
 * Check if donor blood type is compatible with recipient
 * @param {string} donorBloodType - Donor's blood type
 * @param {string} recipientBloodType - Recipient's blood type
 * @returns {boolean} True if compatible
 */
export const isBloodTypeCompatible = (donorBloodType, recipientBloodType) => {
  const compatibleTypes = getCompatibleDonors(recipientBloodType);
  return compatibleTypes.includes(donorBloodType);
};

/**
 * Get blood type description
 * @param {string} bloodType - Blood type
 * @returns {string} Description of blood type
 */
export const getBloodTypeDescription = (bloodType) => {
  const descriptions = {
    'O+': 'O Positive - Universal Donor',
    'O-': 'O Negative - Universal Donor (Rh Negative)',
    'A+': 'A Positive',
    'A-': 'A Negative',
    'B+': 'B Positive',
    'B-': 'B Negative',
    'AB+': 'AB Positive - Universal Recipient',
    'AB-': 'AB Negative - Universal Recipient (Rh Negative)',
  };
  return descriptions[bloodType] || 'Unknown';
};

export default {
  BLOOD_TYPES,
  BLOOD_TYPE_COMPATIBILITY,
  getCompatibleDonors,
  isBloodTypeCompatible,
  getBloodTypeDescription,
};
