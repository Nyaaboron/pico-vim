function setup() {
    createCanvas(screen.x, screen.y);
    noSmooth();

    InitBuffer(
        [
            "#include <stdio.h>",
            "",
            "int main(int argc, char** argv)",
            "{",
            "  printf(\"Hello, World!\\n\");",
            "  return 0;",
            "}"
        ]
    );

    pixy = new Pixy(
        Vector2.MonoVec2(0).toArr(),
        screen.toArr(),
        cellSize.copy().mul(gridSize).toArr());
}

function keyPressed() {
    if (key === "Escape") {
        mode = Mode.Normal;
        commandStr = "";
        ClampCursorInBuffer();
        print("commandStr cleared");
        return;
    }

    // ignore special keys
    if (key === "Shift"
        || key === "OS"
        || key === "Control"
        || key === "Tab"
        || key === "CapsLock"
        || key === "Alt"
        || key === "PageUp"
        || key === "PageDown"
        || key === "Home"
        || key === "Insert"
        || key === "Delete")
        return;

    commandStr = commandStr.concat(key);
    print(commandStr);

    [NormalControls, InsertControls, CommandControls][mode]();
}

function draw() {
    // reset pixy pixels
    pixy.clear();

    RenderBuffer();
    RenderCursor();
    RenderStatusBar(textColor);

    // update pixy
    pixy.updatePixels();

    // render to canvas
    background(0);
    pixy.display();
}

function RenderBuffer() {
    // This offset is used to shift the other lines down
    // whenever some lines exceed `gridSize.x`
    let offset = 0;

    let node = buffer.head;
    for (let i = 0; node != null && i < Math.min(buffer.length + offset, gridSize.y); i++) {
        const pos = [0, (i + offset) * cellSize.y];

        if (node.data.length > 0)
            RenderTextLinkedList(pixy, node.data, textColor, loadedFont, spacing.toArr(), pos);

        // shift the next lines if the current line is too long
        offset += Math.floor(node.data.length / gridSize.x);

        node = node.next;
    }

    // add '~' to show empty lines that are not part of the buffer
    for (let i = buffer.length + offset; i < gridSize.y; i++) {
        const pos = [0, i * cellSize.y];
        RenderText(pixy, '~', emptyColor, loadedFont, spacing.toArr(), pos);
    }
}

function RenderCursor() {
    // calculate y-offset of the cursor to account for line overflows
    let offset = 0;
    let node = buffer.head;
    for (let i = 0; i < cursor.y; i++) {
        offset += Math.floor(node.data.length / gridSize.x);
        node = node.next;
    }
    offset += Math.floor(cursor.x / gridSize.x);

    RenderText(
        pixy,
        '█',
        textColor,
        loadedFont,
        spacing.toArr(),
        new Vector2(cursor.x, cursor.y + offset).mul(cellSize).toArr());
}

function RenderStatusBar(textColor) {
    // current mode
    let modeStr = "";
    if (mode === Mode.Insert)
        modeStr = modeStr.concat("-- INSERT --");

    // cursor position
    const posStr = String(cursor.x + 1) + ":" + String(cursor.y + 1);

    // add space between modeStr and cursorPosStr
    let spacesStr = "";
    for (let i = 0; i < gridSize.x - modeStr.length - posStr.length; i++)
        spacesStr = spacesStr.concat(' ');

    // display status bar
    RenderText(
        pixy,
        modeStr + spacesStr + posStr,
        textColor,
        loadedFont,
        spacing.toArr(),
        [0, (gridSize.y - 1) * cellSize.y]);
}
