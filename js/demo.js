"use strict";

(function() {
  const Calc = ColorContrastCalc.ColorContrastCalc;
  const Utils = ColorContrastCalc.ColorUtils;

  const generateHslColors = function(saturation = 100, lightness = 50) {
    let colors = [Calc.WHITE, Calc.BLACK, Calc.GRAY];
    for (let i = 3; i <= 363; i++ ) {
      colors.push(Calc.newHslColor([i - 3, saturation, lightness]));
    }

    return colors;
  };

  const HSL_COLORS = generateHslColors();

  const sortColors = function(colors, level = "AA") {
    const key = level.toLowerCase();
    return Calc.sort(colors, "hLS", function(color) {
      return color[`${key}Hex`];
    });
  };

  const adjustColor = function(base, color, level, adjustMethod) {
    if (adjustMethod === "Lightness") {
      return base.findLightnessThreshold(color, level);
    } else {
      return base.findBrightnessThreshold(color, level);
    }
  };

  const newAdjustedColor = function(color, base, level, adjustMethod = "Brightness") {
    const newColor = adjustColor(base, color, level, adjustMethod);
    return {
      contrast: Utils.decimalRound(newColor.contrastRatioAgainst(base), 2),
      hex: newColor.hexCode,
      hasSufficientContrast: base.hasSufficientContrast(newColor, level),
      gray: newColor.newGrayscaleColor(100).hexCode
    };
  };

  const colorCombination = function(base, adjusted, toggle = false) {
    if (toggle) {
      return { color: adjusted, background: base };
    }

    return { color: base, background: adjusted };
  };

  const styleFunc = function(baseType, adjustedColor) {
    return function() {
      return colorCombination(this[baseType], this.color[adjustedColor].hex, this.baseColorToggle);
    };
  };

  const grayStyleFunc = function(adjustedColor) {
    return function() {
      return colorCombination(this.baseGray, this.color[adjustedColor].gray, this.baseColorToggle);
    };
  };

  const toGrayScale = function(color) {
        const baseColor = Utils.isString(color) ? new Calc(color) : color;
        return color.newGrayscaleColor(100).hexCode;
  };

  const colorRowsAgainst = function(base, colorList = HSL_COLORS, adjustMethod = "Brightness") {
    return colorList.map(color => {
      return {
        name: color.name,
        hex: color.hexCode,
        origContrast: Utils.decimalRound(color.contrastRatioAgainst(base), 2),
        origContrastLevel: color.contrastLevel(base),
        origSufficientContrast: color.contrastLevel(base) !== "-",
        a: newAdjustedColor(color, base, "A", adjustMethod),
        aa: newAdjustedColor(color, base, "AA", adjustMethod),
        aaa: newAdjustedColor(color, base, "AAA", adjustMethod)
      };
    });
  };

  const sameColorRows = function(colorList = HSL_COLORS, adjustMethod = "Brightness") {
    return colorList.map(color => {
      return {
        name: color.name,
        hex: color.hexCode,
        origContrast: 1,
        origContrastLevel: "-",
        origSufficientContrast: false,
        origGray: toGrayScale(color),
        a: newAdjustedColor(color, color, "A", adjustMethod),
        aa: newAdjustedColor(color, color, "AA", adjustMethod),
        aaa: newAdjustedColor(color, color, "AAA", adjustMethod)
      };
    });
  };

  const complementaryColorRows = function(colorList = HSL_COLORS, adjustMethod = "Brightness") {
    return colorList.map(color => {
      const [h, s, l] = color.hsl;
      const compH = (h + 180) % 360;
      const complementaryColor = Calc.newHslColor([compH, s, l]);

      return {
        name: color.name,
        hex: color.hexCode,
        complementaryHex: complementaryColor.hexCode,
        origContrast: Utils.decimalRound(color.contrastRatioAgainst(complementaryColor), 2),
        origContrastLevel: color.contrastLevel(complementaryColor),
        origSufficientContrast: color.contrastLevel(complementaryColor) !== "-",
        origGray: toGrayScale(color),
        a: newAdjustedColor(color, complementaryColor, "A", adjustMethod),
        aa: newAdjustedColor(color, complementaryColor, "AA", adjustMethod),
        aaa: newAdjustedColor(color, complementaryColor, "AAA", adjustMethod)
      };
    });
  };

  const initBase = Calc.BLACK;
  const initColors = colorRowsAgainst(initBase);

  Vue.component("color-table-header", {
    template: "#color-table-header"
  });

  Vue.component("color-row", {
    props: ["color", "i", "base", "baseGray", "baseColorToggle"],
    template: "#color-row",
    computed: {
      origContrastStyle: function() {
        return [{ "insufficient-contrast": ! this.color.origSufficientContrast }];
      },
      aContrastStyle: function() {
        return [{ 'insufficient-contrast': ! this.color.a.hasSufficientContrast }];
      },
      aaContrastStyle: function() {
        return [{ 'insufficient-contrast': ! this.color.aa.hasSufficientContrast }];
      },
      aaaContrastStyle: function() {
        return [{ 'insufficient-contrast': ! this.color.aaa.hasSufficientContrast }];
      },
      origStyle: function() {
        return colorCombination(this.base, this.color.hex, this.baseColorToggle);
      },
      aStyle: styleFunc("base", "a"),
      aaStyle: styleFunc("base", "aa"),
      aaaStyle: styleFunc("base", "aaa"),
      aGrayStyle: grayStyleFunc("a"),
      aaGrayStyle: grayStyleFunc("aa"),
      aaaGrayStyle: grayStyleFunc("aaa")
    },
    methods: {
      colorIndex: function(i) {
        if (i < 3) {
          return this.color.name;
        }

        return i - 3;
      }
    }
  });

  Vue.component("common-inputs", {
    template: "#common-inputs",
    data: function() {
      return {
        adjust: "Brightness",
        options: [
          { text: "Brightness", value: "Brightness" },
          { text: "Lightness", value: "Lightness" }
        ]
      };
    },
    methods: {
      updateAdjustMethod: function(event) {
        this.$emit('update:adjust', event.target.value);
      }
    }
  });

  const colorTable = new Vue({
    el: "#color-table",
    data: {
      base: initBase,
      colors: initColors,
      saturation: 100,
      lightness: 50,
      baseColorToggle: false,
      adjust: "Brightness"
    },
    computed: {
      baseGray: function() {
        const baseColor = Utils.isString(this.base) ? new Calc(this.base) : this.base;
        return baseColor.newGrayscaleColor(100).hexCode;
      }
    },
    methods: {
      updateList: function() {
        const newColor = new Calc(this.base);
        //const colorList = Calc.NAMED_COLORS;
        const colorList = generateHslColors(this.saturation, this.lightness);
        this.colors = colorRowsAgainst(newColor, colorList, this.adjust);
      }
    }
  });

  const SameColorTable = new Vue({
    el: "#same-color-table",
    data: {
      base: initBase,
      colors: sameColorRows(),
      saturation: 100,
      lightness: 50,
      baseColorToggle: false,
      adjust: "Brightness"
    },
    computed: {
      baseGray: function() {
        const baseColor = Utils.isString(this.base) ? new Calc(this.base) : this.base;
        return baseColor.newGrayscaleColor(100).hexCode;
      }
    },
    methods: {
      updateList: function() {
        //const colorList = Calc.NAMED_COLORS;
        const colorList = generateHslColors(this.saturation, this.lightness);
        this.colors = sameColorRows(colorList, this.adjust);
      }
    }
  });

  const ComplementaryColorTable = new Vue({
    el: "#complementary-color-table",
    data: {
      base: initBase,
      colors: complementaryColorRows(),
      saturation: 100,
      lightness: 50,
      baseColorToggle: false,
      adjust: "Brightness"
    },
    computed: {
      baseGray: function() {
        const baseColor = Utils.isString(this.base) ? new Calc(this.base) : this.base;
        return baseColor.newGrayscaleColor(100).hexCode;
      }
    },
    methods: {
      updateList: function() {
        //const colorList = Calc.NAMED_COLORS;
        const colorList = generateHslColors(this.saturation, this.lightness);
        this.colors = complementaryColorRows(colorList, this.adjust);
      }
    }
  });
})();
