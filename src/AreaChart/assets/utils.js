import { timeFormat, color } from "d3";
import tippy from "tippy.js";
import "tippy.js/themes/light.css";

export const getRandomId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatMillisecond = timeFormat(".%L");
export const formatDayPadded = timeFormat("%e");
export const formatSecond = timeFormat(":%S");
export const formatMinute = timeFormat("%I:%M");
export const formatHour24 = timeFormat("%H:%M");
export const formatHour = timeFormat("%I %p");
export const formatDayWeek = timeFormat("%A");
export const formatWeekDay = timeFormat("%a");
export const formatDay = timeFormat("%b %e");
export const formatWeek = timeFormat("%b %d");
export const formatMonth = timeFormat("%B");
export const formatMonthAbbr = timeFormat("%b");
export const formatYear = timeFormat("%Y");
export const formatDayOnly = timeFormat("%e");
export const formatDate = timeFormat("%b %Y");

export const globals = {
  Android: function () {
    return navigator.userAgent.match(/Android/i);
  },
  BlackBerry: function () {
    return navigator.userAgent.match(/BlackBerry/i);
  },
  iOS: function () {
    return navigator.userAgent.match(/iPhone|iPad|iPod/i);
  },
  Opera: function () {
    return navigator.userAgent.match(/Opera Mini/i);
  },
  Windows: function () {
    return navigator.userAgent.match(/IEMobile/i);
  },
  any: function () {
    return (
      globals.Android() ||
      globals.BlackBerry() ||
      globals.iOS() ||
      globals.Opera() ||
      globals.Windows() ||
      window.innerWidth < 576
    );
  },
  get isMobile() {
    return globals.any();
  },
};

export function ordinal_suffix_of(i) {
  var j = i % 10,
    k = i % 100;
  if (j === 1 && k !== 11) {
    return i + "st";
  }
  if (j === 2 && k !== 12) {
    return i + "nd";
  }
  if (j === 3 && k !== 13) {
    return i + "rd";
  }
  return i + "th";
}

/**
 * Creates tooltip based on tooltipConfig and tippy.js
 * @param {Object} param0 tooltip parameters
 * @param {HtmlElement} param0.element html element this tooltip is attached to
 * @param {Object} param0.datum data object
 * @param {Object} param0.tooltipConfig custom tooltip config
 * @param {Object} param0.tippyConfig some additional tippy.js config
 * @returns tippy instance or null
 */
export function addTooltip({ element, datum, tooltipConfig, tippyConfig }) {
  if (tooltipConfig.show) {

    const content = `
      <div class="CustomTooltip" style="background: ${tooltipConfig.background}">
        ${tooltipConfig.showLabel ? `
          <div class="CustomTooltip__Label" style="color: ${datum.color}">${datum.label}</div>
        ` : ''}
        <div class="CustomTooltip__Value">${datum.value}${tooltipConfig.unit || ""}</div>
      </div>
    `;

    return createTooltip({
      element,
      content,
      config: tippyConfig,
    });
  }
  return null;
}

/**
 * Creates tippy.js instance
 * @param {Object} param0 tooltip parameters
 * @param {HtmlElement} param0.element html element this tooltip is attached to
 * @param {String} param0.content html content for the tooltip
 * @param {Object} param0.config some additional tippy.js config
 * @returns tippy instance
 */
export function createTooltip({ element, content, config }) {
  let tip = element._tippy;

  if (tip) {
    tip.destroy();
  }

  if (content) {
    tip = tippy(element, {
      content,
      allowHTML: true,
      maxWidth: 180,
      arrow: true,
      theme: "light",
      animation: "scale",
      duration: 0,
      trigger: "mouseenter",
      offset: [0, 6],
      popperOptions: {
        modifiers: [
          {
            name: "computeStyles",
            options: {
              gpuAcceleration: false, // true by default
            },
          },
        ],
      },
      ...config,
    });
  }

  return tip;
}

export function generateColors(baseColor, n) {
  if (n === 0) return [baseColor];

  let localColor = color(baseColor);

  return Array.from({ length: n }).map((d, i) => {
    const newColor = localColor.brighter(i ? 1 : 0);
    localColor = newColor.copy();
    return localColor.formatRgb()
  });
}
