import InputController from './InputController.js';
import SelectionBox from './SelectionBox.js';
//import LabelEditor from './LabelEditor.js';
import Node from 'graph/Node.js';
import Edge from 'graph/Edge.js';

import * as Config from 'config.js';

class GraphInputController extends InputController
{
  constructor(graph)
  {
    super(graph);

    //this.labelEditor = new LabelEditor();

    this.prevQuad = {x: 0, y: 0};
    this.firstEmptyClick = false;
    this.firstEmptyTime = 0;

    this.selector = new SelectionBox(this.graph);

    this.hoverTarget = null;
    this.hoverType = null;

    this.shouldDestroyPointlessEdges = Config.DEFAULT_SHOULD_DESTROY_POINTLESS_EDGE;
    //TODO: Trash area should NOT show up on exported image!
    this.trashArea = { x: Config.TRASH_AREA_POSX, y: Config.TRASH_AREA_POSY,
                        width: Config.TRASH_AREA_WIDTH, height: Config.TRASH_AREA_HEIGHT };
  }

  onUpdate(dt)
  {
    const x = this.pointer.x;
    const y = this.pointer.y;

    //Get hover target
    this.hoverTarget = null;
    if (this.hoverTarget = this.pointer.getNodeAt(x, y))
    {
      this.hoverType = "node";
    }
    else if (this.hoverTarget = this.pointer.getEdgeAt(x, y))
    {
      this.hoverType = "edge";
    }
    else if (this.hoverTarget = this.pointer.getEdgeByEndPointAt(x, y))
    {
      this.hoverType = "endpoint";
    }
  }

  onInputDown(x, y, target, targetType)
  {
    if (this.selector.hasSelection())
    {
      //Unselect everything is clicked on something other than nodes...
      if (targetType != "node" || !this.selector.isTargetSelected(target))
      {
        this.selector.clearSelection();
      }
    }
  }

  onInputMove(x, y, target, targetType) {}
  onInputUp(x, y, target, targetType) {}

  onInputAction(x, y, target, targetType)
  {
    //If is in move mode...
    if (this.pointer.moveMode)
    {
      return false;
    }
    //If is NOT in move mode...
    else
    {
      //If selected target...
      if (targetType === 'node')
      {
        //Toggle accept for selected node
        target.accept = !target.accept;
        return true;
      }
      else if (targetType === 'edge')
      {
        //Edit label for selected edge
        this.openLabelEditor(target);
        return true;
      }
      //If hovered target is none...
      else if (this.pointer.targetType === 'none')
      {
        //TODO: this may have a bug in where you must triple click
        const initTime = this.pointer.initial.time;
        if (this.firstEmptyClick)
        {
          //If within the time to double tap...
          if (Date.now() - initTime < Config.DOUBLE_TAP_TICKS)
          {
            //Create state at position
            this.createNode(x, y);
          }

          //Reset empty click
          this.firstEmptyClick = false;
          this.firstEmptyTime = 0;
        }
        else
        {
          //This is the first empty click, should wait for another...
          this.firstEmptyClick = true;
          this.firstEmptyTime = initTime;
        }

        return true;
      }
      else
      {
        return false;
      }
    }
  }

  onDragStart(x, y, target, targetType)
  {
    const pointer = this.pointer;

    //Enabled move mode
    if (pointer.moveMode)
    {
      //Makes sure that placeholders are not quadratics!
      if (targetType === '' && target.isPlaceholder())
      {
        pointer.moveMode = false;

        //Ignore drag event...
        return false;
      }
      //Moving node (and selected nodes)
      else if (targetType === 'node')
      {
        //target MUST be an instance of Node...
        if (!(target instanceof Node))
          throw new Error("Invalid target " + target + " for type \'" + targetType + "\'. Must be an instance of Node.");

        //Ready to move node(s)...
        return true;
      }
      //Moving edge center point
      else if (targetType === 'edge')
      {
        //target MUST be an instance of Edge...
        if (!(target instanceof Edge))
          throw new Error("Invalid target " + target + " for type \'" + targetType + "\'. Must be an instance of Edge.");

        //Makes sure that placeholders are not quadratics!
        if (target.isPlaceholder())
        {
          pointer.moveMode = false;
          return false;
        }

        //Ready to move the edge vertex to pointer...
        return true;
      }
      //Moving edge endpoint
      else if (targetType === 'endpoint')
      {
        //target MUST be an instance of Edge...
        if (!(target instanceof Edge))
          throw new Error("Invalid target " + target + " for type \'" + targetType + "\'. Must be an instance of Edge.");

        this.prevQuad.x = target.quad.x;
        this.prevQuad.y = target.quad.y;

        //Ready to move the edge endpoint to pointer...
      }
      //Moving nothing
      else if (targetType === 'none')
      {
        this.pointer.initial.targetType = "graph";
        //TODO: offset graph by x and y

        //Ready to move the graph to pointer...
      }
      else
      {
        //All move drag should be handled
        throw new Error("Unknown target type \'" + targetType + "\'.");
      }

      return true;
    }
    //Disabled move mode
    else
    {
      //If action dragged a node...
      if (targetType === 'node')
      {
        const edge = this.graph.newEdge(target, this.pointer, Config.STR_TRANSITION_PROXY_LABEL);

        //Redirect pointer to refer to the edge as the new target
        this.pointer.initial.target = edge;
        this.pointer.initial.targetType = "endpoint";

        //Reset previous quad values for new proxy edge
        this.prevQuad.x = 0;
        this.prevQuad.y = 0;

        //Ready to move proxy edge to pointer...
        this.pointer.moveMode = true;
        return true;
      }
      //If action dragged nothing...
      else if (targetType === 'none')
      {
        //Begin selection box...
        this.selector.beginSelection(x, y);
        return true;
      }
      else
      {
        //Other action drags are ignored, such as:
        // - Edges
        // - Endpoints
        // - Graphs
        return false;
      }
    }

    return false;
  }

  onDragMove(x, y, target, targetType)
  {
    const pointer = this.pointer;

    //Enabled move mode
    if (pointer.moveMode)
    {
      //Continue to move node(s)
      if (targetType === 'node')
      {
        const selector = this.selector;
        if (selector.hasSelection())
        {
          this.moveMultipleNodesTo(pointer, selector.getSelection(), x, y);
        }
        else
        {
          this.moveNodeTo(pointer, target, x, y);
        }
        return true;
      }
      //Continue to move edge vertex
      else if (targetType === 'edge')
      {
        this.moveEdgeTo(pointer, target, x, y);
        return true;
      }
      //Continue to move edge endpoint
      else if (targetType === 'endpoint')
      {
        this.moveEndpointTo(pointer, target, x, y);
        return true;
      }
      //Continue to move graph
      else if (targetType === 'graph')
      {
        //Move graph
        return true;
      }
      else
      {
        //All move drag should be handled
        throw new Error("Unknown target type \'" + targetType + "\'.");
      }
    }
    //Disabled move mode
    else
    {
      const selector = this.selector;
      //If the selection box is active...
      if (selector.isActive())
      {
        //Update the selection box
        this.selector.updateSelection(x, y);
        return true;
      }

      //Otherwise, don't do anything. Cause even action drags will become move drags.
    }

    return false;
  }

  onDragStop(x, y, target, targetType)
  {
    const pointer = this.pointer;

    //Enabled move mode
    if (pointer.moveMode)
    {
      //If stopped dragging a node...
      if (targetType === 'node')
      {
        //Delete it if withing trash area...
        if (this.isWithinTrash(x, y))
        {
          //If there exists selected states, delete them all!
          const selector = this.selector;
          if (selector.hasSelection())
          {
            //Remove from graph
            for(const node of selector.getSelection())
            {
              this.graph.deleteNode(node);
            }

            //Remove from selection
            selector.clearSelection();
          }
          else
          {
            //Delete a single node
            this.graph.deleteNode(target);
          }

          return true;
        }
        //If dragged to an empty space (not trash)
        else
        {
          //Do nothing, since should have moved to position
          return true;
        }
      }
      //If stopped dragging a edge...
      else if (targetType === 'edge')
      {
        //Do nothing, since should have moved to position
        return true;
      }
      //If stopped dragging a endpoint...
      else if (targetType === 'endpoint')
      {
        //Delete it if withing trash area...
        if (this.isWithinTrash(x, y))
        {
          this.graph.deleteEdge(target);
          return true;
        }
        //If hovering over a node...
        else if (pointer.targetType === 'node')
        {
          //Should already have finalized the proxy edge
          //target.to = pointer.target;

          //Open label editor if default edge...
          if (target.label === Config.STR_TRANSITION_PROXY_LABEL)
          {
            target.label = Config.STR_TRANSITION_DEFAULT_LABEL;
            this.openLabelEditor(target);
          }
          return true;
        }
        //If hovering over anything else...
        else
        {
          //Destroy any edge that no longer have a destination
          if (this.shouldDestroyPointlessEdges)
          {
            this.graph.deleteEdge(target);
            return true;
          }
          //Keep edges as placeholders (used in DFA's)
          else
          {
            target.makePlaceholder();

            //Open label editor if default edge...
            if (target.label === Config.STR_TRANSITION_PROXY_LABEL)
            {
              target.label = Config.STR_TRANSITION_DEFAULT_LABEL;
              this.openLabelEditor(target);
            }
            return true;
          }
        }
      }
      else if (targetType === 'graph')
      {
        //Do nothing. It should already be moved.
      }
      else
      {
        //All move drag should be handled
        throw new Error("Unknown target type \'" + targetType + "\'.");
      }
    }
    //Disabled move mode
    else
    {
      //If was trying to select...
      if (this.selector.isActive())
      {
        //Stop selecting stuff, fool.
        this.selector.endSelection(x, y);
        return true;
      }
    }

    return false;
  }

  createNode(x, y)
  {
    const node = this.graph.newNode(x, y, Config.STR_STATE_LABEL + (this.graph.nodes.length));
    node.x = x || (Math.random() * Config.SPAWN_RADIUS * 2) - Config.SPAWN_RADIUS;
    node.y = y || (Math.random() * Config.SPAWN_RADIUS * 2) - Config.SPAWN_RADIUS;
    return node;
  }

  openLabelEditor(target, placeholder=null)
  {
    //this.labelEditor.open(target, placeholder);
  }

  isWithinTrash(x, y)
  {
    const dx = x - this.trashArea.x;
    const dy = y - this.trashArea.y;
    return dx > 0 && dx < this.trashArea.width &&
            dy > 0 && dy < this.trashArea.height;
  }

  moveNodeTo(pointer, node, x, y)
  {
    node.x = x;
    node.y = y;
  }

  moveMultipleNodesTo(pointer, nodes, x, y)
  {
    //Moves all nodes by difference between initial position with passed-in x and y
    const dx = x - pointer.initial.x;
    const dy = y - pointer.initial.y;
    for(const node of nodes)
    {
      node.x += dx;
      node.y += dy;
    }

    //Updates initial position to passed-in x and y to maintain relative position
    pointer.initial.x = x;
    pointer.initial.y = y;
  }

  moveEdgeTo(pointer, edge, x, y)
  {
    edge.setQuadraticByAbsolute(x, y);
  }

  moveEndpointTo(pointer, edge, x, y)
  {
    const dst = pointer.targetType === 'node' ? pointer.target : this.pointer;
    edge.to = dst;

    //If the cursor returns to the state after leaving it...
    if (edge.isSelfLoop())
    {
      //Make it a self loop
      const dx = edge.from.x - x;
      const dy = edge.from.y - y;
      const angle = Math.atan2(dy, dx);
      edge.makeSelfLoop(angle);
    }
    //Otherwise, maintain original curve
    else
    {
      edge.quad.x = this.prevQuad.x;
      edge.quad.y = this.prevQuad.y;
    }
  }
}

export default GraphInputController;
