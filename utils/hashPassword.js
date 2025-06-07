import bcrypt from 'bcrypt';

export const hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, 10); // 10 salt rounds
};

export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

