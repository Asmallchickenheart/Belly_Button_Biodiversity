// store json data
let sample_data;

// store sample metadata id-index map
let sample_data_map = {};

// load when page is ready
async function init() {
    sample_data = await d3.json("data/samples.json")

    // create sample metadata id-index map
    for (let i = 0; i < sample_data.metadata.length; i++) {
        sample_data_map[sample_data.metadata[i]["id"]] = i;
    }

    // get metadata
    const metadata = sample_data.metadata;

    // put metadata into dropdown menu
    const dropdown = d3.select("#dropdown");
    metadata.forEach((sample) => {
        // create list item for each sample
        // <li><a class="dropdown-item" href="#">940</a></li>
        const listItem = dropdown.append("li");
        const link = listItem.append("a")
            .attr("class", "dropdown-item")
            .attr("href", "#")
            .text(`${sample.id}`);

        // add event listener to each link
        link.on("click", () => {
            // update metadata
            updateData(sample.id);
        });
    })

    // load default data
    updateData(metadata[0]["id"]);
}

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/horizontal-bar-chart
function BarChart(data, {
    x = d => d, // given d in data, returns the (quantitative) x-value
    y = (d, i) => i, // given d in data, returns the (ordinal) y-value
    title, // given d in data, returns the title text
    marginTop = 30, // the top margin, in pixels
    marginRight = 0, // the right margin, in pixels
    marginBottom = 10, // the bottom margin, in pixels
    marginLeft = 30, // the left margin, in pixels
    width = 640, // the outer width of the chart, in pixels
    height, // outer height, in pixels
    xType = d3.scaleLinear, // type of x-scale
    xDomain, // [xmin, xmax]
    xRange = [marginLeft, width - marginRight], // [left, right]
    xFormat, // a format specifier string for the x-axis
    xLabel, // a label for the x-axis
    yPadding = 0.1, // amount of y-range to reserve to separate bars
    yDomain, // an array of (ordinal) y-values
    yRange, // [top, bottom]
    color = "currentColor", // bar fill color
    titleColor = "white", // title fill color when atop bar
    titleAltColor = "currentColor", // title fill color when atop background
    sample_id,
} = {}) {
    // Compute values.
    const X = d3.map(data, x);
    const Y = d3.map(data, y);

    // Compute default domains, and unique the y-domain.
    if (xDomain === undefined) xDomain = [0, d3.max(X)];
    if (yDomain === undefined) yDomain = Y;
    yDomain = new d3.InternSet(yDomain);

    // Omit any data not present in the y-domain.
    const I = d3.range(X.length).filter(i => yDomain.has(Y[i]));

    // Compute the default height.
    if (height === undefined) height = Math.ceil((yDomain.size + yPadding) * 25) + marginTop + marginBottom;
    if (yRange === undefined) yRange = [marginTop, height - marginBottom];

    // Construct scales and axes.
    const xScale = xType(xDomain, xRange);
    const yScale = d3.scaleBand(yDomain, yRange).padding(yPadding);
    const xAxis = d3.axisTop(xScale).ticks(width / 80, xFormat);
    const yAxis = d3.axisLeft(yScale).tickSizeOuter(0);

    // Compute titles.
    if (title === undefined) {
        const formatValue = xScale.tickFormat(100, xFormat);
        title = i => `${formatValue(X[i])}`;
    } else {
        const O = d3.map(data, d => d);
        const T = title;
        title = i => T(O[i], i, data);
    }

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height + 15])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    // Draw bars.
    svg.append("g")
        .attr("transform", `translate(0,${marginTop})`)
        .call(xAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").clone()
            .attr("y2", height - marginTop - marginBottom)
            .attr("stroke-opacity", 0.1))
        .call(g => g.append("text")
            .attr("x", width - marginRight)
            .attr("y", -22)
            .attr("fill", "currentColor")
            .attr("text-anchor", "end")
            .text(xLabel));

    // Draw the bars.
    svg.append("g")
        .attr("fill", color)
        .selectAll("rect")
        .data(I)
        .join("rect")
        .attr("x", xScale(0))
        .attr("y", i => yScale(Y[i]))
        .attr("width", i => xScale(X[i]) - xScale(0))
        .attr("height", yScale.bandwidth());

    // Draw the titles.
    svg.append("g")
        .attr("fill", titleColor)
        .attr("text-anchor", "end")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .selectAll("text")
        .data(I)
        .join("text")
        .attr("x", i => xScale(X[i]))
        .attr("y", i => yScale(Y[i]) + yScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("dx", -4)
        .text(title)
        .call(text => text.filter(i => xScale(X[i]) - xScale(0) < 20) // short bars
            .attr("dx", +4)
            .attr("fill", titleAltColor)
            .attr("text-anchor", "start"));

    // Draw the y-axis.
    svg.append("g")
        .attr("transform", `translate(${marginLeft},0)`)
        .call(yAxis);

    // Draw chart title in the middle.
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + 10})`)
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .text(`Top 10 OTUs Found In Subject ID ${sample_id}`);

    return svg.node();
}

function BubbleChart(data) {
    const X = d3.map(data, d => d.otu_ids);
    const Y = d3.map(data, d => d.sample_values);
    const xLabel = "OTU ID";

    let colors = d3.schemeTableau10;
    let color = d3.scaleOrdinal(colors);

    // Set the margins for the chart
    let margin = {
        top: 20,
        right: 20,
        bottom: 30,
        left: 40
    };

// Set the dimensions of the chart
    let width = 1200;
    let height = 350;

    // get max values for x and y
    let xMax = d3.max(X);
    let yMax = d3.max(Y);

    // get corresponding values for xMax and yMax
    let xMaxValue = X.indexOf(xMax);
    let yMaxValue = Y.indexOf(yMax);

    console.log(`xMax: ${xMax}, yMax: ${yMax}, xMaxValue: ${xMaxValue}, yMaxValue: ${yMaxValue}`);

    // Set the scales for the chart
    let xScale = d3.scaleLinear()
        .domain([0, xMax + xMaxValue /2 + 100])
        .range([0, width]);

    const xAxis = d3.axisBottom(xScale).tickSizeOuter(0)

    const maxYHeight = 2.5 * yMax;
    let yScale = d3.scaleLinear()
        .domain([0, maxYHeight])
        .range([height, 0]);

    const yAxis = d3.axisLeft(yScale).tickPadding(40).tickSizeOuter(0).ticks(5)

    // Select the container element and append an SVG element to it
    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-50, 0, width, height + margin.top + margin.bottom])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    // draw bubbles
    svg.append("g")
        .selectAll("circle")
        .data(data)
        .join("circle")
        .attr("fill", d => color(d.otu_ids))
        .attr("cx", d => xScale(d.otu_ids))
        .attr("cy", d => yScale(d.sample_values))
        .attr("r", d => d.sample_values/2)
        .attr("opacity", 0.8)

    // draw vertical grid lines
    svg.append("g")
        .attr("transform", `translate(0, ${height})`) // translate to the bottom of the chart area
        .call(xAxis)
        .call(g => g.selectAll(".tick line").clone()
            .attr("y2", -height)
            .attr("stroke-opacity", 0.1))

    // draw horizontal grid lines
    svg.append("g")
        .call(yAxis)
        .call(g => g.selectAll(".tick line").clone()
            .attr("x2", width)
            .attr("stroke-opacity", 0.1))

    // add x-axis label
    svg.append("text")
        .attr("transform", `translate(${width / 2}, ${height + margin.top + 20})`)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("fill", "black")
        .text(xLabel);

    return svg.node();
}

function updateData(sample_id) {
    const sample_index = sample_data_map[sample_id];
    const x = sample_data.samples[sample_index]["sample_values"];
    const y = sample_data.samples[sample_index]["otu_ids"];

    // create x-y map
    let xy_map = [];
    for (let i = 0; i < x.length; i++) {
        xy_map.push({sample_values: x[i], otu_ids: y[i]});
    }

    const svgElement = BarChart(
        xy_map.slice(0, 10),
        {
            x: d => d.sample_values,
            y: d => "OTU" + d.otu_ids,
            xLabel: "Sample Values →",
            color: "steelblue",
            marginLeft: 65,
            sample_id: sample_id
        }
    )

    document.getElementById("otu-chart").innerHTML = "";
    document.getElementById("otu-chart").appendChild(svgElement)

    // load gauge chart
    // TODO

    // load bubble chart
    const bubbleChart = BubbleChart(xy_map)

    document.getElementById("bubble-chart").innerHTML = "";
    document.getElementById("bubble-chart").appendChild(bubbleChart)

    // load Demographic Info
    const metadata = sample_data.metadata[sample_index];
    const demographicInfo = document.getElementById("sample-metadata");
    demographicInfo.innerHTML = "";
    for (const [key, value] of Object.entries(metadata)) {
        const row = `
        <tr>
        <th scope="row" class="text-capitalize">${key}</th>
        <td>${value}</td>`
        demographicInfo.innerHTML += row;
    }

    // update dropdown
    const dropdown = document.getElementById("dropdownMenuButton1");
    dropdown.textContent = sample_id;
}

init().then(() => {
    console.log("Init complete")
})