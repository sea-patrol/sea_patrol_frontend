import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { describe, expect, it } from 'vitest';

import { GameUiProvider, GAME_UI_MODE, useGameUi } from '../../../features/ui-shell/model/GameUiContext';
import GameUiHotkeys from '../../../features/ui-shell/ui/GameUiHotkeys';

function HotkeysHarness() {
  const inputRef = useRef(null);
  const { activeWindow, mode, setScreenMode } = useGameUi();

  useEffect(() => {
    setScreenMode(GAME_UI_MODE.SAILING);
  }, [setScreenMode]);

  return (
    <>
      <GameUiHotkeys chatInputRef={inputRef} />
      <input ref={inputRef} aria-label="chat-input" />
      <div data-testid="mode">{mode}</div>
      <div data-testid="window">{activeWindow ?? 'none'}</div>
    </>
  );
}

describe('GameUiHotkeys', () => {
  it('centralizes chat, window and menu hotkeys', async () => {
    render(
      <GameUiProvider>
        <HotkeysHarness />
      </GameUiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.SAILING);
    });

    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.CHAT_FOCUS);
    expect(screen.getByLabelText('chat-input')).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.SAILING);

    fireEvent.keyDown(window, { key: 'i' });
    expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.WINDOW_FOCUS);
    expect(screen.getByTestId('window')).toHaveTextContent('INVENTORY');

    fireEvent.keyDown(window, { key: 'm' });
    expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.WINDOW_FOCUS);
    expect(screen.getByTestId('window')).toHaveTextContent('MAP');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.SAILING);
    expect(screen.getByTestId('window')).toHaveTextContent('none');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.MENU_OPEN);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.SAILING);
  });

  it('ignores global hotkeys while an editable element owns the keyboard focus', async () => {
    render(
      <GameUiProvider>
        <HotkeysHarness />
      </GameUiProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.SAILING);
    });

    const input = screen.getByLabelText('chat-input');
    input.focus();

    fireEvent.keyDown(input, { key: 'i' });
    expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.SAILING);
    expect(screen.getByTestId('window')).toHaveTextContent('none');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.getByTestId('mode')).toHaveTextContent(GAME_UI_MODE.SAILING);
  });
});
