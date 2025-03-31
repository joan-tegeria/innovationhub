export const transformWorkspacesResponse = (inputData) => {
    if (!Array.isArray(inputData)) {
      console.warn("Input data is not an array:", inputData);
      return [];
    }

    const result = {};

    inputData.forEach((item) => {
      if (!item.Name) {
        console.warn("Item Name is undefined:", item);
        return;
      }

      const nameParts = item.Name.split(" - ");
      const name = nameParts[0];

      if (!result[name]) {
        result[name] = {
          label: name,
          value: [],
        };
      }

      if (nameParts.length > 1 && nameParts[1] === "Multi Pass") {
        result[name].value.unshift(item.id);
      } else {
        result[name].value.push(item.id);
      }
    });

    return Object.values(result);
  };



  