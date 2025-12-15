import { CharacterSelect } from './components/CharacterSelect';
import { GameScreen } from './components/GameScreen';
import { useGameState } from './hooks/useGameState';
import './App.css';

function App() {
  const {
    pet,
    gameStarted,
    startGame,
    feedPet,
    playWithPet,
    sleepPet,
    cleanPet,
    resetGame,
  } = useGameState();

  return (
    <div className="app">
      {!gameStarted ? (
        <CharacterSelect onSelect={startGame} />
      ) : pet ? (
        <GameScreen
          pet={pet}
          onFeed={feedPet}
          onPlay={playWithPet}
          onSleep={sleepPet}
          onClean={cleanPet}
          onReset={resetGame}
        />
      ) : null}
    </div>
  );
}

export default App;
