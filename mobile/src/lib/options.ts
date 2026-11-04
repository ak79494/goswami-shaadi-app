// Dropdown values. Where the web app already had a list, the same strings are used so
// profiles created on web and mobile look identical.

export const MARITAL_STATUS = ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'];

export const RELIGIONS = ['Hindu', 'Jain', 'Sikh', 'Buddhist', 'Other'];

export const COMMUNITIES = ['Brahmin-Goswami', 'Brahmin', 'Other'];

export const SUB_COMMUNITIES = [
  'Goswami', 'Giri', 'Puri', 'Bharti', 'Tirtha', 'Vana', 'Aranya', 'Parvata', 'Ashrama', 'Saraswati', 'Sagara',
];

export const MOTHER_TONGUES = [
  'Hindi', 'Bengali', 'Gujarati', 'Marathi', 'Rajasthani', 'Punjabi', 'Odia', 'Assamese', 'Nepali',
  'Maithili', 'Bhojpuri', 'Telugu', 'Kannada', 'Tamil', 'Malayalam', 'English', 'Other',
];

// 4'5" to 7'0", stored as "feet.inches" like the web app ("5.10" = 5 ft 10 in).
export const HEIGHTS: string[] = (() => {
  const list: string[] = [];
  for (let ft = 4; ft <= 7; ft++) {
    for (let inch = 0; inch <= 11; inch++) {
      if ((ft === 4 && inch < 5) || (ft === 7 && inch > 0)) continue;
      list.push(`${ft}.${inch}`);
    }
  }
  return list;
})();

export const BODY_TYPES = ['Slim', 'Average', 'Athletic', 'Heavy'];

export const EDUCATION = [
  'High School', 'Diploma', 'B.A.', 'B.Com', 'B.Sc', 'B.Tech / B.E.', 'BBA', 'BCA', 'MBBS', 'BDS', 'LLB',
  'M.A.', 'M.Com', 'M.Sc', 'M.Tech / M.E.', 'MBA', 'MCA', 'MD / MS', 'CA', 'CS', 'PhD', 'Other',
];

export const PROFESSIONS = [
  'Software Professional', 'Engineer', 'Doctor', 'Teacher / Professor', 'Government Service', 'Banking / Finance',
  'Chartered Accountant', 'Lawyer', 'Business / Self Employed', 'Defence', 'Civil Services', 'Nurse',
  'Sales / Marketing', 'Designer', 'Student', 'Not Working', 'Other',
];

export const INCOME_RANGES = [
  'Not working', 'Up to ₹3 Lakh', '₹3 – 5 Lakh', '₹5 – 10 Lakh', '₹10 – 20 Lakh', '₹20 – 35 Lakh',
  '₹35 – 50 Lakh', '₹50 Lakh+',
];

export const FAMILY_TYPES = ['Joint', 'Nuclear'];
export const FAMILY_VALUES = ['Traditional', 'Moderate', 'Liberal'];

export const OCCUPATIONS = [
  'Business', 'Service (Private)', 'Service (Government)', 'Retired', 'Homemaker', 'Farmer', 'Professional',
  'Not Alive', 'Other',
];

export const FOOD = ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan', 'Jain'];
export const YES_NO = ['No', 'Occasionally', 'Yes'];
export const LIFESTYLE = ['Simple', 'Moderate', 'Modern'];
export const MANGLIK = ['No', 'Yes', "Don't Know"];

export const RASHI = [
  'Mesh (Aries)', 'Vrishabh (Taurus)', 'Mithun (Gemini)', 'Kark (Cancer)', 'Simha (Leo)', 'Kanya (Virgo)',
  'Tula (Libra)', 'Vrishchik (Scorpio)', 'Dhanu (Sagittarius)', 'Makar (Capricorn)', 'Kumbh (Aquarius)',
  'Meen (Pisces)',
];

export const NAKSHATRA = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha',
  'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula',
  'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada',
  'Uttara Bhadrapada', 'Revati',
];

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jammu & Kashmir', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Outside India',
];

export const HOBBIES = [
  'Travelling', 'Music', 'Reading', 'Technology', 'Photography', 'Fitness', 'Movies', 'Cooking', 'Dancing',
  'Yoga', 'Cricket', 'Art', 'Gardening', 'Spirituality', 'Writing', 'Volunteering',
];
