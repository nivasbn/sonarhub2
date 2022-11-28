import * as d3Modules from "d3";
import { format } from "d3";
import {
  formatDayPadded,
  formatHour24,
  formatMonthAbbr,
  formatWeekDay,
  getRandomId,
  globals,
  ordinal_suffix_of,
  addTooltip,
  generateColors,
} from "./utils";

const d3 = {
  ...d3Modules,
  selection: d3Modules.selection,
};

export default function AreaChartD3(params) {
  initPatternify();

  const attrs = Object.assign(
    {
      container: "body",
      data: null,
      config: {
        width: 400,
        height: 300,
        margin: {
          top: 35,
          right: 30,
          bottom: 35,
          left: 80,
        },
        timePeriod: "day",
        container: {
          defaultAspectRatio: 0.5625,
          breakpoints: [
            {
              screenWidth: "575px",
              aspectRatio: 0.75,
            },
          ],
        },
        xAxis: {
          visible: true,
          majorGridlines: { visible: false },
          minorGridlines: { visible: false },
        },
        yAxis: {
          ticks: 6,
          visible: true,
          majorGridlines: { visible: false },
          minorGridlines: { visible: false },
        },
        area: {
          visible: true,
          keys: ["value_a", "value_b"],
          colors: ["#88bb9a", "#d9e6df"],
        },
        nullData: {
          show: true,
          highlightGaps: true,
        },
      },
    },
    params
  );

  const chartId = getRandomId();
  const animDur = 500;
  const dx = {
    hour: 0,
    day: 0,
    week: 1,
    month: 1,
    year: 1,
    quarter: 1,
  };

  // Global instance variables
  let container,
    svg,
    chart,
    chartWidth,
    chartHeight,
    yScale,
    xScale,
    chartData,
    interval,
    areaSeries,
    colors;

  function main() {
    container = d3.select(attrs.container);

    setDimensions();
    drawContainers();

    if (attrs.data) {
      setupScales();
      drawAxes(true);
      drawArea();
      addTooltipRects();
    }
  }

  function addTooltipRects() {
    const group = chart.patternify({
      tag: "g",
      selector: "tooltip-group",
    });

    const flatData = areaSeries
      .flatMap((d) => {
        return d.map((x) => ({
          ...x,
          key: d.key,
          label: attrs.config.area.labels[d.key],
          color: attrs.config.area.baseColor,
          index: d.index,
        }));
      })
      .sort((a, b) => {
        return b.index - a.index;
      });

    const tooltipWidthPortion = 1;

    const tooltipRects = group
      .patternify({
        tag: "rect",
        selector: "tooltip-rect",
        data: attrs.config.tooltip.show ? flatData : [],
      })
      .attr("x", (d) => {
        const width =
          xScale(d.data.dateMs + interval * tooltipWidthPortion) -
          xScale(d.data.dateMs);
        return xScale(d.data.dateMs) - width / 2;
      })
      .attr("y", (d) => {
        return yScale(d[1]);
      })
      .attr("width", (d) => {
        const width =
          xScale(d.data.dateMs + interval * tooltipWidthPortion) -
          xScale(d.data.dateMs);
        return width;
      })
      .attr("height", (d) => {
        return chartHeight - yScale(d[1]);
      })
      .attr("fill", "transparent")
      .on("mouseenter", function (e, d) {
        tooltipRects.attr("fill", "transparent");
        d3.select(this).attr("fill", "rgba(0, 0, 0, 0.1)");
        svg.selectAll(".area-group").attr("opacity", (x) => {
          return x.key === d.key ? 1 : 0.2;
        });
      })
      .on("mouseleave", function () {
        tooltipRects.attr("fill", "transparent");

        svg.selectAll(".area-group").attr("opacity", null);
      });

    tooltipRects.each(function (d) {
      addTooltip({
        element: this,
        datum: {
          label: d.label,
          value: d.data[d.key],
          color: attrs.config.tooltip.labelColor,
        },
        tooltipConfig: attrs.config.tooltip,
        tippyConfig: {},
      });
    });
  }

  function drawAxes(animate) {
    const xAxisTickSize = attrs.config.xAxis.majorGridlines.visible
      ? -chartHeight
      : 0;

    const xAxis = d3
      .axisBottom(xScale)
      .tickSize(xAxisTickSize)
      .tickPadding(10)
      .tickValues(getTickValues())
      .tickFormat(getXAxisFormat());

    const yAxisTickSize = attrs.config.yAxis.majorGridlines.visible
      ? -chartWidth
      : 0;

    const axisGen =
      attrs.config.yAxis.position === "left" ? d3.axisLeft : d3.axisRight;

    const yAxis = axisGen(yScale)
      .tickSizeInner(attrs.config.yAxis.tickLineWidth)
      .ticks(5)
      .tickPadding(10)
      .tickFormat(format(attrs.config.yAxis.tickFormat));

    if (yAxisTickSize) {
      yAxis.tickSize(yAxisTickSize);
    }

    svg
      .patternify({
        tag: "text",
        selector: "y-axis-label",
        data: attrs.config.yAxis.title ? [attrs.config.yAxis.title] : [],
      })
      .attr("text-anchor", "end")
      .attr("y", 6)
      .attr("x", -chartHeight / 2 + attrs.config.margin.top)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text((d) => d);

    chart
      .patternify({
        tag: "g",
        selector: "x-axis",
      })
      .classed("axis", true)
      .attr("transform", `translate(0, ${chartHeight})`)
      .style("display", attrs.config.xAxis.visible ? null : "none")
      .call(xAxis);

    const yAxisGroup = chart
      .patternify({
        tag: "g",
        selector: "y-axis",
      })
      .style("display", attrs.config.yAxis.visible ? null : "none")
      .attr("transform", () => {
        return attrs.config.yAxis.position === "left"
          ? null
          : `translate(${chartWidth})`;
      })
      .attr("text-anchor", () => {
        return attrs.config.yAxis.position === "left" ? "end" : `start`;
      })
      .classed("axis", true);

    if (animate) {
      yAxisGroup.transition().duration(animDur).call(yAxis);
    } else {
      yAxisGroup.call(yAxis);
    }
  }

  function drawArea() {
    const { config: { timePeriod, area: areaConfig } } = attrs;

    const line = d3
      .area()
      .x((d) => {
        return xScale(
          d.data.dateMs + dx[timePeriod] * interval * 0.5
        );
      })
      .y(([, y2]) => yScale(y2))
      .curve(d3[areaConfig.curve || "curveLinear"]);

    const area = d3
      .area()
      .x((d) => {
        return xScale(
          d.data.dateMs + dx[timePeriod] * interval * 0.5
        );
      })
      .y0(([y1]) => yScale(y1))
      .y1(([, y2]) => yScale(y2))
      .curve(d3[areaConfig.curve || "curveLinear"]);

    const areaGroup = chart.patternify({
      tag: "g",
      selector: "series",
    });

    const areas = areaGroup.patternify({
      tag: "g",
      selector: "area-group",
      data: areaSeries,
    })
    .attr("data-name", (d) => d.key)

    areas
      .patternify({
        tag: "path",
        selector: "area",
        data: d => [d],
      })
      .attr("data-name", (d) => d.key)
      .attr("fill", ({ color }) => color)
      .attr("d", area)
      .attr("display", areaConfig.visible ? null : "none");

      areas
      .patternify({
        tag: "path",
        selector: "line",
        data: d => [d],
      })
      .attr("stroke", areaConfig.lineColor)
      .attr("d", line);
  }

  function setupScales() {
    chartData = attrs.data.map((d, i) => {
      const date = new Date(d.timestamp.replace("Z", ""));

      return {
        ...d,
        date: date,
        dateMs: date.getTime(),
      };
    });

    interval = chartData[1].dateMs - chartData[0].dateMs;

    const stack = d3
      .stack()
      .keys(attrs.config.area.keys)
      .order(d3[attrs.config.area.stackOrder] || d3.stackOrderNone)
      .offset(d3.stackOffsetNone);

    areaSeries = stack(chartData);

    areaSeries.forEach((d) => {
      d.color = colors[d.key];
    });

    const yDomain = [
      0,
      d3.max(areaSeries.flat(), ([y1, y2]) => Math.max(y1, y2)),
    ];

    const xDomain = [
      d3.min(chartData, (d) => d.dateMs),
      d3.max(chartData, (d) => d.dateMs) +
        dx[attrs.config.timePeriod] * interval,
    ];

    xScale = d3.scaleUtc().domain(xDomain).range([0, chartWidth]).clamp(true);
    yScale = d3.scaleLinear().domain(yDomain).range([chartHeight, 0]).nice();
  }

  function drawContainers() {
    svg = container
      .patternify({
        tag: "svg",
        selector: "svg-container",
      })
      .attr("width", attrs.config.width)
      .attr("height", attrs.config.height);

    chart = svg
      .patternify({
        tag: "g",
        selector: "chart-group",
      })
      .attr(
        "transform",
        "translate(" + [attrs.config.margin.left, attrs.config.margin.top] + ")"
      );
  }

  function setDimensions() {
    colors = generateColors(
      attrs.config.area.baseColor,
      attrs.config.area.keys.length
    ).reduce((acc, d, i) => {
      acc[attrs.config.area.keys[i]] = d;
      return acc;
    }, {});

    if (attrs.config.yAxis.position === "left") {
      attrs.config.margin.left = attrs.config.yAxis.width;
    } else {
      attrs.config.margin.right = attrs.config.yAxis.width;
    }

    const boundingBox = container.node().getBoundingClientRect();

    if (boundingBox.width > 0) {
      attrs.config.width = boundingBox.width;
    }

    let aspectRatio = attrs.config.container.defaultAspectRatio;

    const breakpoint = attrs.config.container.breakpoints.find(
      (d) => window.innerWidth <= d.screenWidth
    );

    if (breakpoint) {
      aspectRatio = breakpoint.aspectRatio;
    }

    if (aspectRatio) {
      attrs.config.height = attrs.config.width * aspectRatio;
    }

    chartWidth = attrs.config.width - attrs.config.margin.left - attrs.config.margin.right;
    chartHeight = attrs.config.height - attrs.config.margin.top - attrs.config.margin.bottom;
  }

  function getXAxisFormat() {
    switch (attrs.config.timePeriod) {
      case "hour":
        return (date, i) => {
          const time = formatHour24(date);
          return time;
        };

      case "day":
        return (date, i) => {
          const time = formatHour24(date);
          if (time === "12:00") {
            return globals.isMobile ? "NN" : "Noon";
          }
          return time;
        };

      case "week":
        return (date) => {
          const name = formatWeekDay(date);
          return name[0];
        };

      case "month":
        return (date) => {
          // const month = formatMonthAbbr(date);
          const day = formatDayPadded(date);
          return ordinal_suffix_of(+day);
        };

      case "quarter":
        return formatMonthAbbr;

      case "year":
        return formatMonthAbbr;

      default:
        return formatMonthAbbr;
    }
  }

  function getTickValues() {
    switch (attrs.config.timePeriod) {
      case "hour": {
        const data = chartData.map((d) => {
          return d.date;
        });
        return [
          ...data,
          // new Date(
          //   chartData[chartData.length - 1].dateMs + interval - 60 * 1000
          // ),
        ];
      }

      case "day": {
        const factor = globals.isMobile ? 12 : 6;
        const data = chartData
          .filter((d, i) => i % factor === 0)
          .map((d) => {
            return d.date;
          });
        return [
          ...data,
          // new Date(
          //   chartData[chartData.length - 1].dateMs + interval - 60 * 1000
          // ),
        ];
      }

      case "week": {
        return chartData.map((d) => {
          return new Date(d.dateMs + interval / 2);
        });
      }

      case "month": {
        return chartData
          .filter((d, i) => {
            const day = +formatDayPadded(d.date);
            return day % 7 === 0 || day === 1;
          })
          .map((d) => {
            return new Date(d.dateMs + interval / 2);
          });
      }

      case "quarter": {
        return chartData.map((d) => {
          return new Date(d.dateMs + interval / 2);
        });
      }

      case "year": {
        let data = chartData;

        if (globals.isMobile) {
          data = chartData.filter((d, i) => {
            return i % 2 === 0;
          });
        }

        return data.map((d) => {
          return new Date(d.dateMs + interval / 2);
        });
      }

      default:
        return chartData.map((d) => d.date);
    }
  }

  main.render = () => {
    main();

    d3.select(window).on("resize." + chartId, () => {
      setDimensions();
      drawContainers();

      if (attrs.data) {
        setupScales();
        drawAxes();
        drawArea();
        addTooltipRects();
      }
    });
    return main;
  };

  main.updateData = ({ data, config }) => {
    attrs.data = data;
    attrs.config = config;

    if (attrs.data) {
      setDimensions();
      setupScales();
      drawAxes(true);
      drawArea();
      addTooltipRects();
    }

    return main;
  };

  main.updateConfig = (config) => {
    attrs.config = config;

    if (attrs.data) {
      setDimensions();
      setupScales();
      drawAxes(false);
      drawArea();
      addTooltipRects();
    }

    return main;
  };

  return main;
}

function initPatternify() {
  d3.selection.prototype.patternify = function (params) {
    var container = this;
    var selector = params.selector;
    var elementTag = params.tag;
    var data = params.data || [selector];

    // Pattern in action
    var selection = container.selectAll("." + selector).data(data, (d, i) => {
      if (typeof d === "object") {
        if (d.id) {
          return d.id;
        }
      }
      return i;
    });
    selection.exit().remove();
    selection = selection.enter().append(elementTag).merge(selection);
    selection.attr("class", selector);
    return selection;
  };
}
