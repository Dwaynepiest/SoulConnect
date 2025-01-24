function validatePassword(password) {
  if (!password) {
    console.log('Password is undefined or empty');
    return false;
  }

  const minLength = 16;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[@$!%*?&#]/.test(password);

  const isValid = password.length >= minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
  console.log(`Password validation result: ${isValid}`);
  console.log(`Password: ${password}`);
  console.log(`Length: ${password.length >= minLength}`);
  console.log(`Uppercase: ${hasUppercase}`);
  console.log(`Lowercase: ${hasLowercase}`);
  console.log(`Number: ${hasNumber}`);
  console.log(`SpecialChar: ${hasSpecialChar}`);
  return isValid;
}

module.exports = validatePassword;