const example = (value = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return value + action.num;
    case 'DECREMENT':
      return value - action.num;
    default:
      return value;
  }
};

export default example;
