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
  if (typeof value === 'object' && attributeName === 'style') {
    assignStyle(value, htmlElement)
    return
  }

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

  // setAttribute stringifies the value, and we don't want to assign null or undefined
  // as a string directly. Setting undefined/null means we don't need the attribute
  if (value == null) {
    htmlElement.removeAttribute(attributeName)
    return
  }

  htmlElement.setAttribute(attributeName, value);
}

function assignStyle(value: object, htmlElement: HTMLElement) {
    // reset everything
    htmlElement.style.cssText = ''

    if (value == null) return

    Object.entries(value).forEach(([property, propertyValue]) => {
      htmlElement.style.setProperty(property, propertyValue)
    })
}

export { assignDomAttribute };
