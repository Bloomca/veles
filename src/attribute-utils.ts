const ENUMERATED_BOOLEAN_ATTRIBUTES: {
  [attributeName: string]: {
    trueValue: string;
    falseValue: string;
  };
} = {
  draggable: {
    trueValue: "true",
    falseValue: "false",
  },
  contenteditable: {
    trueValue: "true",
    falseValue: "false",
  },
  spellcheck: {
    trueValue: "true",
    falseValue: "false",
  },
  translate: {
    trueValue: "yes",
    falseValue: "no",
  },
};

function assignDomAttribute({
  htmlElement,
  attributeName,
  value,
  previousValue,
}: {
  htmlElement: HTMLElement;
  attributeName: string;
  value: any;
  previousValue?: any;
}) {
  if (attributeName === "style") {
    assignStyle({ value, previousValue, htmlElement });
    return;
  }

  if (typeof value === "boolean") {
    const normalizedAttributeName = attributeName.toLowerCase();
    const enumeratedConfig = ENUMERATED_BOOLEAN_ATTRIBUTES[normalizedAttributeName];

    if (enumeratedConfig) {
      htmlElement.setAttribute(
        attributeName,
        value ? enumeratedConfig.trueValue : enumeratedConfig.falseValue,
      );
      return;
    }

    // according to the spec, boolean values should just get either an empty string
    // or duplicate the attribute name. A lack of the attribute means
    // the value is `false`.
    if (value) {
      htmlElement.setAttribute(attributeName, "");
    } else {
      htmlElement.removeAttribute(attributeName);
    }

    return;
  }

  // setAttribute stringifies the value, and we don't want to assign null or undefined
  // as a string directly. Setting undefined/null means we don't need the attribute
  if (value == null) {
    htmlElement.removeAttribute(attributeName);
    return;
  }

  htmlElement.setAttribute(attributeName, value);
}

function assignStyle({
  value,
  previousValue,
  htmlElement,
}: {
  value: any;
  previousValue?: any;
  htmlElement: HTMLElement;
}) {
  if (value == null) {
    htmlElement.style.cssText = "";
    htmlElement.removeAttribute("style");
    return;
  }

  if (typeof value !== "object") {
    htmlElement.style.cssText = String(value);
    return;
  }

  const hasPreviousStyleObject = previousValue != null && typeof previousValue === "object";

  if (!hasPreviousStyleObject) {
    htmlElement.style.cssText = "";
  } else {
    // delete all style properties which were present in the previous style
    // object, but are absent in the new one
    Object.keys(previousValue).forEach((property) => {
      if (!(property in value) || value[property] == null) {
        htmlElement.style.removeProperty(property);
      }
    });
  }

  Object.entries(value).forEach(([property, propertyValue]) => {
    if (propertyValue == null) {
      htmlElement.style.removeProperty(property);
      return;
    }

    // do not update properties which are the same value as before
    if (hasPreviousStyleObject && previousValue[property] === propertyValue) {
      return;
    }

    htmlElement.style.setProperty(property, String(propertyValue));
  });
}

export { assignDomAttribute };
