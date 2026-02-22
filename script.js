class PriorityQueue {
	constructor() { this._heap = []; }
	_swap(i,j){[this._heap[i],this._heap[j]]=[this._heap[j],this._heap[i]]}
	_parent(i){return Math.floor((i-1)/2)}
	_left(i){return i*2+1}
	_right(i){return i*2+2}
	push(item, priority){
		const node = {item,priority};
		this._heap.push(node);
		let i = this._heap.length-1;
		while(i>0){
			const p = this._parent(i);
			if(this._heap[p].priority <= this._heap[i].priority) break;
			this._swap(i,p); i = p;
		}
	}
	pop(){
		if(this._heap.length===0) return null;
		const root = this._heap[0];
		const last = this._heap.pop();
		if(this._heap.length>0){
			this._heap[0]=last;
			let i=0;
			while(true){
				const l=this._left(i), r=this._right(i);
				let smallest=i;
				if(l<this._heap.length && this._heap[l].priority < this._heap[smallest].priority) smallest=l;
				if(r<this._heap.length && this._heap[r].priority < this._heap[smallest].priority) smallest=r;
				if(smallest===i) break;
				this._swap(i,smallest); i=smallest;
			}
		}
		return root.item;
	}
	isEmpty(){return this._heap.length===0}
}

function defaultKey(node){
	if(typeof node === 'string') return node;
	return JSON.stringify(node);
}

function reconstructPath(cameFrom, currentKey){
	const path = [];
	let k = currentKey;
	while(k){
		path.push(cameFrom.get(k).node);
		k = cameFrom.get(k).parentKey;
	}
	return path.reverse();
}

/**
 * Generic A* implementation.
 * - start: start node (any value)
 * - isGoal(node): returns true when node is goal
 * - neighbors(node): returns array of {node, cost}
 * - heuristic(node): estimated cost from node to goal
 * - keyFn(node): optional function returning unique key for node
 * Returns array of nodes from start to goal or null if no path.
 */
function aStar(start, isGoal, neighbors, heuristic, keyFn=defaultKey){
	const open = new PriorityQueue();
	const startKey = keyFn(start);
	open.push(start, heuristic(start));

	const gScore = new Map();
	gScore.set(startKey, 0);

	const cameFrom = new Map();
	cameFrom.set(startKey, {node: start, parentKey: null});

	const closed = new Set();

	while(!open.isEmpty()){
		const current = open.pop();
		const currentKey = keyFn(current);
		if(isGoal(current)){
			return reconstructPath(cameFrom, currentKey);
		}
		if(closed.has(currentKey)) continue;
		closed.add(currentKey);

		const currentG = gScore.get(currentKey) ?? Infinity;
		for(const {node:neighbor, cost} of neighbors(current)){
			const neighKey = keyFn(neighbor);
			if(closed.has(neighKey)) continue;
			const tentativeG = currentG + (cost ?? 1);
			const prevG = gScore.get(neighKey) ?? Infinity;
			if(tentativeG < prevG){
				gScore.set(neighKey, tentativeG);
				cameFrom.set(neighKey, {node: neighbor, parentKey: currentKey});
				const f = tentativeG + heuristic(neighbor);
				open.push(neighbor, f);
			}
		}
	}

	return null;
}

// --- Demo: grid example ---
function gridNeighbors(grid){
	const h = grid.length, w = grid[0].length;
	return (node) => {
		const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
		const res = [];
		for(const [dx,dy] of dirs){
			const nx = node.x+dx, ny = node.y+dy;
			if(nx<0||ny<0||nx>=w||ny>=h) continue;
			if(grid[ny][nx]===1) continue; // 1 = obstacle
			res.push({node:{x:nx,y:ny}, cost:1});
		}
		return res;
	}
}

function manhattan(goal){
	return (node) => Math.abs(node.x - goal.x) + Math.abs(node.y - goal.y);
}

function demo(){
	const grid = [
		[0,0,0,0,0],
		[0,1,1,1,0],
		[0,0,0,1,0],
		[0,1,0,0,0],
		[0,0,0,0,0]
	];
	const start = {x:0,y:0};
	const goal = {x:4,y:4};

	const path = aStar(
		start,
		(n)=> n.x===goal.x && n.y===goal.y,
		gridNeighbors(grid),
		manhattan(goal),
		(n)=> `${n.x},${n.y}`
	);

	if(!path){
		console.log('Kein Pfad gefunden');
		return;
	}

	console.log('Pfad gefunden:', path);
	// print grid with path
	const out = grid.map(row=>row.slice());
	for(const p of path) out[p.y][p.x] = '*';
	out[start.y][start.x] = 'S';
	out[goal.y][goal.x] = 'G';
	console.log(out.map(r=>r.join(' ')).join('\n'));
}

// Run demo when executed directly
if(typeof require !== 'undefined' && require.main === module){
	demo();
}

