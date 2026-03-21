#include <stdio.h>
#include <stdlib.h>

void move(int dx, int dy) {
    char cmd[100];
    snprintf(cmd, sizeof(cmd), "xdotool mousemove_relative -- %d %d", dx, dy);
    system(cmd);
}

void click(int button, int press) {
    char cmd[100];
    if (press)
        snprintf(cmd, sizeof(cmd), "xdotool mousedown %d", button);
    else
        snprintf(cmd, sizeof(cmd), "xdotool mouseup %d", button);
    system(cmd);
}

void scroll(int dx, int dy) {
    // simple vertical scroll
    if (dy > 0)
        system("xdotool click 5");
    else if (dy < 0)
        system("xdotool click 4");
}