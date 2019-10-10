const DEFAULT_REFRESH_TICKS = 10;

class GraphChangeHandler
{
    constructor(graph, refreshTicks = DEFAULT_REFRESH_TICKS)
    {
        this._graph = graph;
        this._cachedGraphHash = 0;

        this._refreshTicks = refreshTicks;

        this._listeners = [];

        this._updateInterval = null;
        this.update = this.update.bind(this);
    }

    addListener(listener)
    {
        if (typeof listener !== 'function')
            throw new Error('Cannot add uncallable listener');
        this._listeners.push(listener);
    }

    removeListener(listener)
    {
        const i = this._listeners.indexOf(listener);
        if (i >= 0)
        {
            this._listeners.splice(i, 1);
            return true;
        }
        return false;
    }

    clearListeners() { this._listeners.length = 0; }
    getListeners() { return this._listeners; }

    startListening()
    {
        this._updateInterval = setInterval(this.update, this._refreshTicks);
        this.update();
    }

    stopListening()
    {
        clearInterval(this._updateInterval);
    }

    reset()
    {
        this._cachedGraphHash = 0;
        this.update();
    }

    update()
    {
        const graph = this._graph;
        const graphHash = graph.getHashCode(false);
        if (graphHash !== this._cachedGraphHash)
        {
            this._cachedGraphHash = graphHash;
            for (const listener of this._listeners)
            {
                listener(graph);
            }
        }
    }
}

export default GraphChangeHandler;
