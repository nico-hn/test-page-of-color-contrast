"use strict";

(function() {
  const Calc = ColorContrastCalc.ColorContrastCalc;
  const Utils = ColorContrastCalc.ColorUtils;

  const generateHslColors = function(saturation = 100, lightness = 50) {
    let colors = [];
    for (let i = 0; i <= 360; i++ ) {
      colors.push(Calc.newHslColor([i, saturation, lightness]));
    }

    return colors;
  };

  const HSL_COLORS = generateHslColors();

  const decimalRound = function(number, precision) {
    const factor = Math.pow(10, precision);
    return Math.round(number * factor) / factor;
  };

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
      contrast: decimalRound(newColor.contrastRatioAgainst(base), 2),
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

  const toGrayScale = function(color) {
        const baseColor = Utils.isString(color) ? new Calc(color) : color;
        return color.newGrayscaleColor(100).hexCode;
  };

  const colorRow = function(color, base, adjustMethod = "Brightness") {
    return {
      name: color.name,
      hex: color.hexCode,
      origContrast: decimalRound(color.contrastRatioAgainst(base), 2),
      origContrastLevel: color.contrastLevel(base),
      origSufficientContrast: color.contrastLevel(base) !== "-",
      a: newAdjustedColor(color, base, "A", adjustMethod),
      aa: newAdjustedColor(color, base, "AA", adjustMethod),
      aaa: newAdjustedColor(color, base, "AAA", adjustMethod)
    };
  };

  const colorRowsAgainst = function(baseColor, colorList = HSL_COLORS, adjustMethod = "Brightness") {
    return colorList.map(color => colorRow(color, baseColor, adjustMethod));
  };

  const sameColorRow = function(color, adjustMethod = "Brightness") {
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
  };

  const sameColorRows = function(colorList = HSL_COLORS, adjustMethod = "Brightness") {
    return colorList.map(color => sameColorRow(color, adjustMethod));
  };

  const initBase = Calc.BLACK;
  const initColors = colorRowsAgainst(initBase);
  const initSameColors = sameColorRows();

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
      aStyle: function() {
        return colorCombination(this.base, this.color.a.hex, this.baseColorToggle);
      },
      aaStyle: function() {
        return colorCombination(this.base, this.color.aa.hex, this.baseColorToggle);
      },
      aaaStyle: function() {
        return colorCombination(this.base, this.color.aaa.hex, this.baseColorToggle);
      },
      aGrayStyle: function() {
        return colorCombination(this.baseGray, this.color.a.gray, this.baseColorToggle);
      },
      aaGrayStyle: function() {
        return colorCombination(this.baseGray, this.color.aa.gray, this.baseColorToggle);
      },
      aaaGrayStyle: function() {
        return colorCombination(this.baseGray, this.color.aaa.gray, this.baseColorToggle);
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
      colors: initSameColors,
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
})();
