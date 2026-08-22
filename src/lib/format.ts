export const formatLkr = (amount: number) =>
  `Rs. ${new Intl.NumberFormat("en-LK").format(amount)}`;

export const compactLkr = (amount: number) => {
  if (amount >= 1000000) {
    const value = amount / 1000000;
    return `Rs. ${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}M`;
  }
  return formatLkr(amount);
};
