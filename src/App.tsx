import { CharacterSelect } from './components/CharacterSelect';
import { GameScreen } from './components/GameScreen';
import { useGameState } from './hooks/useGameState';
import './App.css';

function App() {
  const {
    pet,
    gameStarted,
    showLevelUp,
    showEvolution,
    startGame,
    feedPet,
    playWithPet,
    sleepPet,
    cleanPet,
    resetGame,
    purchaseUpgrade,
    hasSavedGame,
    continueSavedGame,
    equipItem,
    unequipItem,
    processMinigameResult,
  } = useGameState();

  return (
    <div className="app">
      {!gameStarted ? (
        <CharacterSelect 
          onSelect={startGame} 
          hasSavedGame={hasSavedGame()}
          onContinue={continueSavedGame}
        />
      ) : pet ? (
        <GameScreen
          pet={pet}
          showLevelUp={showLevelUp}
          showEvolution={showEvolution}
          onFeed={feedPet}
          onPlay={playWithPet}
          onSleep={sleepPet}
          onClean={cleanPet}
          onReset={resetGame}
          onPurchaseUpgrade={purchaseUpgrade}
          onEquipItem={equipItem}
          onUnequipItem={unequipItem}
          onMinigameComplete={processMinigameResult}
        />
      ) : null}
    </div>
  );
}

export default App;
