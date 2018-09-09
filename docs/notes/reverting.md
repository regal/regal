# Reverting State

`Game.postUndoCommand` uses `buildRevertFunction` to undo the effects of the last player command.

If the last player command modified agent properties, their values should be changed back to what they were before.

If the last player command added agent properties, they should be deleted.
