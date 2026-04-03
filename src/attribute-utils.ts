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
}: {
  htmlElement: HTMLElement;
  attributeName: string;
  value: any;
}) {
  if (typeof value === "boolean") {
    const normalizedAttributeName = attributeName.toLowerCase();
    const enumeratedConfig = ENUMERATED_BOOLEAN_ATTRIBUTES[normalizedAttributeName];

    if (enumeratedConfig) {
      htmlElement.setAttribute(
        attributeName,
        value ? enumeratedConfig.trueValue : enumeratedConfig.falseValue
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

  htmlElement.setAttribute(attributeName, value);
}

export { assignDomAttribute };
