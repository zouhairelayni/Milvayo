// /src/app/navigation/navigationIntent.cjs
const createNavigationIntent = () => {
 let epoch = 0;
 return {
  begin: target => ({ target, epoch }),
  accept: (intent, target) => !!intent && intent.target === target && intent.epoch === epoch,
  advance: () => { epoch += 1; },
 };
};
module.exports = { createNavigationIntent };
