export type VelesDOMElementProps = {
  // Clipboard Events
  onCopy?: any | undefined;
  onCopyCapture?: any | undefined;
  onCut?: any | undefined;
  onCutCapture?: any | undefined;
  onPaste?: any | undefined;
  onPasteCapture?: any | undefined;

  // Composition Events
  onCompositionEnd?: any | undefined;
  onCompositionEndCapture?: any | undefined;
  onCompositionStart?: any | undefined;
  onCompositionStartCapture?: any | undefined;
  onCompositionUpdate?: any | undefined;
  onCompositionUpdateCapture?: any | undefined;

  // Focus Events
  onFocus?: any | undefined;
  onFocusCapture?: any | undefined;
  onBlur?: any | undefined;
  onBlurCapture?: any | undefined;

  // Form Events
  onChange?: any | undefined;
  onChangeCapture?: any | undefined;
  onBeforeInput?: any | undefined;
  onBeforeInputCapture?: any | undefined;
  onInput?: any | undefined;
  onInputCapture?: any | undefined;
  onReset?: any | undefined;
  onResetCapture?: any | undefined;
  onSubmit?: any | undefined;
  onSubmitCapture?: any | undefined;
  onInvalid?: any | undefined;
  onInvalidCapture?: any | undefined;

  // Image Events
  onLoad?: any | undefined;
  onLoadCapture?: any | undefined;
  onError?: any | undefined; // also a Media Event
  onErrorCapture?: any | undefined; // also a Media Event

  // Keyboard Events
  onKeyDown?: any | undefined;
  onKeyDownCapture?: any | undefined;
  /** @deprecated */
  onKeyPress?: any | undefined;
  /** @deprecated */
  onKeyPressCapture?: any | undefined;
  onKeyUp?: any | undefined;
  onKeyUpCapture?: any | undefined;

  // Media Events
  onAbort?: any | undefined;
  onAbortCapture?: any | undefined;
  onCanPlay?: any | undefined;
  onCanPlayCapture?: any | undefined;
  onCanPlayThrough?: any | undefined;
  onCanPlayThroughCapture?: any | undefined;
  onDurationChange?: any | undefined;
  onDurationChangeCapture?: any | undefined;
  onEmptied?: any | undefined;
  onEmptiedCapture?: any | undefined;
  onEncrypted?: any | undefined;
  onEncryptedCapture?: any | undefined;
  onEnded?: any | undefined;
  onEndedCapture?: any | undefined;
  onLoadedData?: any | undefined;
  onLoadedDataCapture?: any | undefined;
  onLoadedMetadata?: any | undefined;
  onLoadedMetadataCapture?: any | undefined;
  onLoadStart?: any | undefined;
  onLoadStartCapture?: any | undefined;
  onPause?: any | undefined;
  onPauseCapture?: any | undefined;
  onPlay?: any | undefined;
  onPlayCapture?: any | undefined;
  onPlaying?: any | undefined;
  onPlayingCapture?: any | undefined;
  onProgress?: any | undefined;
  onProgressCapture?: any | undefined;
  onRateChange?: any | undefined;
  onRateChangeCapture?: any | undefined;
  onResize?: any | undefined;
  onResizeCapture?: any | undefined;
  onSeeked?: any | undefined;
  onSeekedCapture?: any | undefined;
  onSeeking?: any | undefined;
  onSeekingCapture?: any | undefined;
  onStalled?: any | undefined;
  onStalledCapture?: any | undefined;
  onSuspend?: any | undefined;
  onSuspendCapture?: any | undefined;
  onTimeUpdate?: any | undefined;
  onTimeUpdateCapture?: any | undefined;
  onVolumeChange?: any | undefined;
  onVolumeChangeCapture?: any | undefined;
  onWaiting?: any | undefined;
  onWaitingCapture?: any | undefined;

  // MouseEvents
  onAuxClick?: (e: MouseEvent) => any | undefined;
  onAuxClickCapture?: (e: MouseEvent) => any | undefined;
  onClick?: (e: MouseEvent) => any | undefined;
  onClickCapture?: (e: MouseEvent) => any | undefined;
  onContextMenu?: (e: MouseEvent) => any | undefined;
  onContextMenuCapture?: (e: MouseEvent) => any | undefined;
  onDoubleClick?: (e: MouseEvent) => any | undefined;
  onDoubleClickCapture?: (e: MouseEvent) => any | undefined;
  onDrag?: any | undefined;
  onDragCapture?: any | undefined;
  onDragEnd?: any | undefined;
  onDragEndCapture?: any | undefined;
  onDragEnter?: any | undefined;
  onDragEnterCapture?: any | undefined;
  onDragExit?: any | undefined;
  onDragExitCapture?: any | undefined;
  onDragLeave?: any | undefined;
  onDragLeaveCapture?: any | undefined;
  onDragOver?: any | undefined;
  onDragOverCapture?: any | undefined;
  onDragStart?: any | undefined;
  onDragStartCapture?: any | undefined;
  onDrop?: any | undefined;
  onDropCapture?: any | undefined;
  onMouseDown?: (e: MouseEvent) => any | undefined;
  onMouseDownCapture?: (e: MouseEvent) => any | undefined;
  onMouseEnter?: (e: MouseEvent) => any | undefined;
  onMouseLeave?: (e: MouseEvent) => any | undefined;
  onMouseMove?: (e: MouseEvent) => any | undefined;
  onMouseMoveCapture?: (e: MouseEvent) => any | undefined;
  onMouseOut?: (e: MouseEvent) => any | undefined;
  onMouseOutCapture?: (e: MouseEvent) => any | undefined;
  onMouseOver?: (e: MouseEvent) => any | undefined;
  onMouseOverCapture?: (e: MouseEvent) => any | undefined;
  onMouseUp?: (e: MouseEvent) => any | undefined;
  onMouseUpCapture?: (e: MouseEvent) => any | undefined;

  // Selection Events
  onSelect?: any | undefined;
  onSelectCapture?: any | undefined;

  // Touch Events
  onTouchCancel?: any | undefined;
  onTouchCancelCapture?: any | undefined;
  onTouchEnd?: any | undefined;
  onTouchEndCapture?: any | undefined;
  onTouchMove?: any | undefined;
  onTouchMoveCapture?: any | undefined;
  onTouchStart?: any | undefined;
  onTouchStartCapture?: any | undefined;

  // Pointer Events
  onPointerDown?: any | undefined;
  onPointerDownCapture?: any | undefined;
  onPointerMove?: any | undefined;
  onPointerMoveCapture?: any | undefined;
  onPointerUp?: any | undefined;
  onPointerUpCapture?: any | undefined;
  onPointerCancel?: any | undefined;
  onPointerCancelCapture?: any | undefined;
  onPointerEnter?: any | undefined;
  onPointerLeave?: any | undefined;
  onPointerOver?: any | undefined;
  onPointerOverCapture?: any | undefined;
  onPointerOut?: any | undefined;
  onPointerOutCapture?: any | undefined;
  onGotPointerCapture?: any | undefined;
  onGotPointerCaptureCapture?: any | undefined;
  onLostPointerCapture?: any | undefined;
  onLostPointerCaptureCapture?: any | undefined;

  // UI Events
  onScroll?: any | undefined;
  onScrollCapture?: any | undefined;

  // Wheel Events
  onWheel?: any | undefined;
  onWheelCapture?: any | undefined;

  // Animation Events
  onAnimationStart?: any | undefined;
  onAnimationStartCapture?: any | undefined;
  onAnimationEnd?: any | undefined;
  onAnimationEndCapture?: any | undefined;
  onAnimationIteration?: any | undefined;
  onAnimationIterationCapture?: any | undefined;

  // Transition Events
  onTransitionEnd?: any | undefined;
  onTransitionEndCapture?: any | undefined;
};
