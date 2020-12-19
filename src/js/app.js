function isDescendant(child, parent) {
  let node = child.parentNode;
  while (node !== null) {
    if (node === parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

class CardState {
  constructor(displayName) {
    this.displayName = displayName;
  }
  enter(card) {}
  onEvent(card, event) {}
  exit(card) {}
}

class IdleCardState extends CardState {
  constructor() {
    super("Idle");
    this._eventX = null;
    this._eventY = null;
  }
  enter(card) {}
  onEvent(card, event) {
    const elem = card._elem;

    if (event.type === "mousedown") {
      this._eventX = event.x;
      this._eventY = event.y;
      return null;
    }
    if (event.type === "mousemove") {
      const nextState = this._chooseNextState(elem, event);
      if (nextState !== null) {
        return nextState;
      }
    }
    if (event.type === "mouseup") {
      this._reset();
    }

    return null;
  }
  exit(card) {
    this._reset();
  }

  _chooseNextState(elem, event) {
    if (this._receiveDownEvent()) {
      if (this._transitionRightScaling(elem, event)) {
        return new RightScalingCardState(this._eventX);
      }
      if (this._transitionLeftScaling(elem, event)) {
        return new LeftScalingCardState(this._eventX);
      }
      if (this._transitionToHorizontalScaling(elem, event)) {
        return new HorizontalScalingCardState(this._eventX);
      }
      if (this._transitionToVerticalScaling(elem, event)) {
        return new VertialScalingCardState(this._eventY);
      }
      if (this._transitionToDragging(elem, event)) {
        return new DraggingCardState(event.x, event.y);
      }
    }
    return null;
  }

  _reset() {
    this._eventX = null;
    this._eventY = null;
  }

  _isCard(target, elem) {
    return target === elem || isDescendant(target, elem);
  }

  _transitionToDragging(elem, event) {
    return this._isCard(event.target, elem);
  }

  _transitionRightScaling(elem, event) {
    if (!this._isCard(event.target, elem)) {
      return;
    }

    const margin = 15;
    const BCR = elem.getBoundingClientRect();
    const insideRightBorder =
      this._eventX > BCR.right - margin && this._eventX <= BCR.right + margin;
    return insideRightBorder && !event.ctrlKey;
  }

  _transitionLeftScaling(elem, event) {
    if (!this._isCard(event.target, elem)) {
      return false;
    }

    const margin = 15;
    const BCR = elem.getBoundingClientRect();
    const insideLeftBorder =
      this._eventX > BCR.left - margin && this._eventX < BCR.left + margin;
    return insideLeftBorder && !event.ctrlKey;
  }

  _transitionToHorizontalScaling(elem, event) {
    if (!this._isCard(event.target, elem)) {
      return false;
    }

    const margin = 15;
    const BCR = elem.getBoundingClientRect();
    const insideLeftBorder =
      this._eventX > BCR.left - margin && this._eventX < BCR.left + margin;
    const insideRightBorder =
      this._eventX > BCR.right - margin && this._eventX <= BCR.right + margin;
    const insideBorders = insideLeftBorder || insideRightBorder;

    return insideBorders && event.ctrlKey;
  }

  _transitionToVerticalScaling(elem, event) {
    if (!this._isCard(event.target, elem)) {
      return false;
    }

    const margin = 15;
    const BCR = elem.getBoundingClientRect();
    const insideTopBorder =
      this._eventY >= BCR.top - margin && this._eventY < BCR.top + margin;
    const insideBottomBorder =
      this._eventY > BCR.bottom - margin && this._eventY < BCR.bottom + margin;
    const insideBorders = insideTopBorder || insideBottomBorder;
    return insideBorders && event.ctrlKey;
  }

  _receiveDownEvent() {
    return this._eventX && this._eventY;
  }
}

class DraggingCardState extends CardState {
  constructor(x, y) {
    super("Dragging");
    this._x = x;
    this._y = y;
  }
  enter(card) {
    card._elem.classList.add("is-dragging");
    document.body.style.cursor = "move";
  }
  onEvent(card, event) {
    if (event.type === "mouseup" || event.type !== "mousemove") {
      return new IdleCardState();
    }

    const dx = event.x - this._x;
    const translateX = card._translateX + dx;
    this._x = event.x;

    const dy = event.y - this._y;
    const translateY = card._translateY + dy;
    this._y = event.y;

    card.translate(translateX, translateY);
    return null;
  }
  exit(card) {
    card._elem.classList.remove("is-dragging");
    document.body.style.cursor = "auto";
  }
}

class HorizontalScalingCardState extends CardState {
  constructor(x) {
    super("HorizontalScaling");
    this._x = x;
    this._width = null;
    this._scaleX = null;
  }
  enter(card) {
    this._width = card.getBCR().width;
    this._scaleX = card._scaleX;
    document.body.style.cursor = "ew-resize";
  }
  onEvent(card, event) {
    if (event.type === "mouseup") {
      return new IdleCardState();
    }
    if (event.type === "mousemove") {
      const dx = event.x - this._x;
      this._scaleX += dx / this._width;
      this._x = event.x;
      card.scaleHorizontally(this._scaleX);
    }
    return null;
  }
  exit(card) {
    this._x = null;
    this._width = null;
    this._scaleX = null;
    document.body.style.cursor = "auto";
  }
}

class VertialScalingCardState extends CardState {
  constructor(y) {
    super("VerticalScaling");
    this._y = y;
    this._height = null;
    this._scaleY = null;
  }
  enter(card) {
    this._height = card.getBCR().height;
    this._scaleY = card._scaleY;
    document.body.style.cursor = "ns-resize";
  }
  onEvent(card, event) {
    if (event.type === "mouseup") {
      return new IdleCardState();
    }
    if (event.type === "mousemove") {
      const dy = event.y - this._y;
      this._scaleY += dy / this._height;
      this._y = event.y;
      card.scaleVertically(this._scaleY);
    }
    return null;
  }
  exit(card) {
    this._y = null;
    this._height = null;
    this._scaleY = null;
    document.body.style.cursor = "auto";
  }
}

class RightScalingCardState extends CardState {
  constructor(x) {
    super("RightScaling");
    this._x = x;
    this._width = null;
  }
  enter(card) {
    const BCR = card.getBCR();
    this._width = BCR.width;
    this._scaleX = card._scaleX;
    this._left = BCR.left;
    // This will move the card right since we always apply
    // a transform that we assumes is calculated from the center.
    card._elem.style.transformOrigin = "left center";
    const leftDiff = card.getBCR().left - this._left;
    // We need to translate the card left to compensate the
    // previous translation.
    card.translate(card._translateX - leftDiff, card._translateY);
    document.body.style.cursor = "e-resize";
  }
  onEvent(card, event) {
    if (event.type === "mouseup") {
      return new IdleCardState();
    }
    if (event.type === "mousemove") {
      const dx = event.x - this._x;
      const scaleX = ((this._width + dx) / this._width) * card._scaleX;
      card.scaleHorizontally(scaleX);
      this._x = event.x;
      this._width += dx;
    }
    return null;
  }
  exit(card) {
    this._x = null;
    this._width = null;
    // We do the opposite operation from the enter callback.
    card._elem.style.transformOrigin = "center center";
    const leftDiff = card.getBCR().left - this._left;
    card.translate(card._translateX - leftDiff, card._translateY);
    document.body.style.cursor = "auto";
  }
}

class LeftScalingCardState extends CardState {
  constructor(x) {
    super("LeftScaling");
    this._x = x;
    this._width = null;
    this._scaleX = null;
  }

  enter(card) {
    const BCR = card.getBCR();
    this._width = BCR.width;
    this._scaleX = card._scaleX;
    this._right = BCR.right;
    card._elem.style.transformOrigin = "right center";
    const rightDiff = this._right - card.getBCR().right;
    card.translate(card._translateX + rightDiff, card._translateY);
    document.body.style.cursor = "e-resize";
  }
  onEvent(card, event) {
    if (event.type === "mouseup") {
      return new IdleCardState();
    }
    if (event.type === "mousemove") {
      const dx = this._x - event.x;
      this._x = event.x;
      card.scaleHorizontally(((this._width + dx) / this._width) * card._scaleX);
      this._width += dx;
    }
    return null;
  }
  exit(card) {
    this._x = null;
    this._width = null;
    this._scaleX = null;
    card._elem.style.transformOrigin = "center center";
    const rightDiff = this._right - card.getBCR().right;
    card.translate(card._translateX + rightDiff, card._translateY);
    document.body.style.cursor = "auto";
  }
}

class Card {
  constructor(elem, stateElem) {
    this._elem = elem;
    this._stateElem = stateElem;
    this._translateX = 0;
    this._translateY = 0;
    this._scaleX = 1;
    this._scaleY = 1;

    this._updateState(new IdleCardState());
    this._registerEventHandlers();
  }

  getBCR() {
    return this._elem.getBoundingClientRect();
  }

  translate(x, y) {
    this._translateX = x;
    this._translateY = y;
    this._applyTransform();
  }

  scaleHorizontally(x) {
    this._scaleX = x;
    this._applyTransform();
  }

  scaleVertically(y) {
    this._scaleY = y;
    this._applyTransform();
  }

  _applyTransform() {
    let transform = `translate(${this._translateX}px,${this._translateY}px)`;
    transform += ` scale(${this._scaleX}, ${this._scaleY})`;
    window.requestAnimationFrame(() => {
      this._elem.style.transform = transform;
    });
  }

  _registerEventHandlers() {
    document.addEventListener("mousedown", (event) => {
      this._forwardEventAndUpdateState(event);
    });
    document.addEventListener("mousemove", (event) => {
      this._forwardEventAndUpdateState(event);
    });
    document.addEventListener("mouseup", (event) => {
      this._forwardEventAndUpdateState(event);
    });
  }

  _forwardEventAndUpdateState(event) {
    event.preventDefault();

    const state = this._state.onEvent(this, event);
    if (state !== null) {
      this._updateState(state);
    }
  }

  _updateState(newState) {
    if (!newState) {
      return;
    }

    if (this._state) {
      this._state.exit(this);
    }
    this._state = newState;
    this._state.enter(this);
    this._displayStateName();
  }

  _displayStateName() {
    this._stateElem.innerHTML = `${this._state.displayName}`;
  }
}

(function (window) {
  "use strict";

  // Prevent default browser dragging behaviour
  window.ondragstart = function () {
    return false;
  };

  const card = new Card(
    document.querySelector(".card"),
    document.getElementById("state")
  );

  const BCR = card.getBCR();
  card.translate(
    window.innerWidth / 2 - BCR.width / 2,
    window.innerHeight / 2 - BCR.height / 2
  );
})(window);
