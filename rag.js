import * as d3 from "d3";

// Graph Data Structure
class RAG {
    constructor() {
        this.nodes = [];
        this.edges = [];
    }

    addNode(id, type) {
        this.nodes.push({ id, type });
    }

    removeNode(id) {
        this.nodes = this.nodes.filter(node => node.id !== id);
        this.edges = this.edges.filter(edge => edge.source !== id && edge.target !== id);
    }

    addEdge(source, target, type) {
        this.edges.push({ source, target, type });
    }

    removeEdge(source, target) {
        this.edges = this.edges.filter(edge => !(edge.source === source && edge.target === target));
    }

    detectCycle() {
        let graph = {};
        this.nodes.forEach(node => graph[node.id] = []);
        this.edges.forEach(edge => graph[edge.source].push(edge.target));
        
        const visited = new Set();
        const stack = new Set();

        const dfs = (node) => {
            if (stack.has(node)) return true;
            if (visited.has(node)) return false;
            visited.add(node);
            stack.add(node);
            for (let neighbor of graph[node] || []) {
                if (dfs(neighbor)) return true;
            }
            stack.delete(node);
            return false;
        };
        
        return this.nodes.some(node => dfs(node.id));
    }
}

// Initialize SVG for D3 visualization
const width = 800, height = 600;
const svg = d3.select("#graph").append("svg").attr("width", width).attr("height", height);
const simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(d => d.id))
    .force("charge", d3.forceManyBody())
    .force("center", d3.forceCenter(width / 2, height / 2));

const rag = new RAG();

// Function to update the graph visualization
function updateGraph() {
    const links = svg.selectAll("line").data(rag.edges);
    links.enter().append("line").merge(links)
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    links.exit().remove();

    const nodes = svg.selectAll("circle").data(rag.nodes);
    nodes.enter().append("circle")
        .attr("r", 20)
        .attr("fill", d => d.type === 'P' ? "blue" : "green")
        .merge(nodes);
    nodes.exit().remove();

    simulation.nodes(rag.nodes).on("tick", () => {
        links.attr("x1", d => d.source.x).attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        nodes.attr("cx", d => d.x).attr("cy", d => d.y);
    });
    simulation.force("link").links(rag.edges);
    simulation.alpha(1).restart();
}

// Event Listeners for UI Interactions
document.getElementById("add-process").addEventListener("click", () => {
    let id = "P" + (rag.nodes.filter(n => n.type === 'P').length + 1);
    rag.addNode(id, "P");
    updateGraph();
});

document.getElementById("add-resource").addEventListener("click", () => {
    let id = "R" + (rag.nodes.filter(n => n.type === 'R').length + 1);
    rag.addNode(id, "R");
    updateGraph();
});

document.getElementById("add-edge").addEventListener("click", () => {
    let source = document.getElementById("source-node").value;
    let target = document.getElementById("target-node").value;
    rag.addEdge(source, target, "request");
    updateGraph();
});

document.getElementById("remove-edge").addEventListener("click", () => {
    let source = document.getElementById("source-node").value;
    let target = document.getElementById("target-node").value;
    rag.removeEdge(source, target);
    updateGraph();
});

document.getElementById("detect-deadlock").addEventListener("click", () => {
    if (rag.detectCycle()) {
        alert("Deadlock detected!");
    } else {
        alert("No deadlock detected.");
    }
});

// Reset Graph
document.getElementById("reset").addEventListener("click", () => {
    rag.nodes = [];
    rag.edges = [];
    updateGraph();
});
