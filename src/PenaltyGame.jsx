import React, { useState } from 'react';

const MAX_SHOTS = 5;

const ZONES = [
  { id: 'tl', col: 0, row: 0 },
  { id: 'tc', col: 1, row: 0 },
  { id: 'tr', col: 2, row: 0 },
  { id: 'ml', col: 0, row: 1 },
  { id: 'mc', col: 1, row: 1 },
  { id: 'mr', col: 2, row: 1 },
  { id: 'bl', col: 0, row: 2 },
  { id: 'bc', col: 1, row: 2 },
  { id: 'br', col: 2, row: 2 },
];

// Ball target position inside goal area (% left, % top)
const BALL_POS = {
  tl: [16, 18], tc: [50, 18], tr: [84, 18],
  ml: [16, 50], mc: [50, 50], mr: [84, 50],
  bl: [16, 80], bc: [50, 80], br: [84, 80],
};

// Keeper dive covers its entire column
const KEEPER_COVERS = {
  left:   ['tl', 'ml', 'bl'],
  center: ['tc', 'mc', 'bc'],
  right:  ['tr', 'mr', 'br'],
};

const KEEPER_X = { left: 15, center: 50, right: 85 };

export default function PenaltyGame() {
  const [score, setScore] = useState(0);
  const [shots, setShots] = useState(0);
  const [history, setHistory] = useState([]); // array of booleans
  const [phase, setPhase] = useState('aim'); // aim | animating | result | gameover
  const [shotZone, setShotZone] = useState(null);
  const [keeperDive, setKeeperDive] = useState('center');
  const [isGoal, setIsGoal] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const shoot = (zoneId) => {
    if (phase !== 'aim') return;

    const sides = ['left', 'center', 'right'];
    const dive = sides[Math.floor(Math.random() * 3)];
    const goal = !KEEPER_COVERS[dive].includes(zoneId);

    setShotZone(zoneId);
    setKeeperDive(dive);
    setIsGoal(goal);
    setPhase('animating');

    const nextShots = shots + 1;
    const nextScore = goal ? score + 1 : score;

    setTimeout(() => {
      setShots(nextShots);
      if (goal) setScore(nextScore);
      setHistory(h => [...h, goal]);
      setPhase('result');

      setTimeout(() => {
        if (nextShots >= MAX_SHOTS) {
          setFinalScore(nextScore);
          setPhase('gameover');
        } else {
          setShotZone(null);
          setKeeperDive('center');
          setPhase('aim');
        }
      }, 1500);
    }, 650);
  };

  const restart = () => {
    setScore(0);
    setShots(0);
    setHistory([]);
    setPhase('aim');
    setShotZone(null);
    setKeeperDive('center');
    setIsGoal(false);
    setFinalScore(0);
  };

  const moving = phase === 'animating' || phase === 'result';
  const [bx, by] = shotZone && moving ? BALL_POS[shotZone] : [50, 88];
  const kx = KEEPER_X[keeperDive];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0e2a0e 0%, #1a4a1a 50%, #2a6a2a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 32,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#fff',
      userSelect: 'none',
    }}>

      <h1 style={{ margin: '0 0 4px', fontSize: 26, letterSpacing: 2, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
        ⚽ PENALTY SHOOTOUT
      </h1>

      {/* Score bar */}
      <div style={{
        display: 'flex', gap: 24, alignItems: 'center',
        background: 'rgba(0,0,0,0.45)',
        padding: '8px 28px', borderRadius: 99, marginBottom: 20, fontSize: 16,
      }}>
        <span>Goals <strong style={{ color: '#4ade80', fontSize: 22 }}>{score}</strong></span>
        <span style={{ opacity: 0.3 }}>|</span>
        <span>Shot <strong>{shots}</strong> / {MAX_SHOTS}</span>
      </div>

      {/* Per-shot indicators */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {Array.from({ length: MAX_SHOTS }).map((_, i) => (
          <div key={i} style={{
            width: 16, height: 16, borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.45)',
            background: i < history.length
              ? (history[i] ? '#4ade80' : '#f87171')
              : 'transparent',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      {/* Goal wrapper */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 500, padding: '0 16px', boxSizing: 'border-box' }}>

        {/* Goal frame */}
        <div style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '54%',
          background: 'linear-gradient(180deg, #a8ccec 0%, #d6eeff 100%)',
          borderTop: '8px solid #f0f0f0',
          borderLeft: '8px solid #f0f0f0',
          borderRight: '8px solid #f0f0f0',
          borderRadius: '4px 4px 0 0',
          boxShadow: '0 0 0 2px #aaa, 0 8px 32px rgba(0,0,0,0.5)',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>

          {/* Net grid */}
          {Array.from({ length: 13 }).map((_, i) => (
            <div key={`v${i}`} style={{
              position: 'absolute', left: `${((i + 1) / 14) * 100}%`,
              top: 0, bottom: 0, width: 1,
              background: 'rgba(255,255,255,0.4)',
            }} />
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={`h${i}`} style={{
              position: 'absolute', top: `${((i + 1) / 8) * 100}%`,
              left: 0, right: 0, height: 1,
              background: 'rgba(255,255,255,0.4)',
            }} />
          ))}

          {/* Zone divider guides (visible while aiming) */}
          {phase === 'aim' && [1, 2].map(i => (
            <React.Fragment key={i}>
              <div style={{
                position: 'absolute', left: `${i * 33.33}%`, top: 0, bottom: 0,
                width: 1, background: 'rgba(255,255,100,0.4)', pointerEvents: 'none',
              }} />
              <div style={{
                position: 'absolute', top: `${i * 33.33}%`, left: 0, right: 0,
                height: 1, background: 'rgba(255,255,100,0.4)', pointerEvents: 'none',
              }} />
            </React.Fragment>
          ))}

          {/* Keeper */}
          <div style={{
            position: 'absolute',
            bottom: '5%',
            left: `${kx}%`,
            transform: `translateX(-50%) ${
              moving && keeperDive === 'left'  ? 'rotate(-30deg) translateX(-10px) scaleX(1.3)' :
              moving && keeperDive === 'right' ? 'rotate(30deg)  translateX(10px)  scaleX(1.3)' :
              'rotate(0deg)'
            }`,
            fontSize: 40,
            transition: moving
              ? 'left 0.22s cubic-bezier(0.2,0,0.3,1), transform 0.22s ease'
              : 'none',
            filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
            lineHeight: 1,
            zIndex: 4,
          }}>
            {moving && keeperDive !== 'center' ? '🤸' : '🧤'}
          </div>

          {/* Ball */}
          <div style={{
            position: 'absolute',
            left: `${bx}%`,
            top: `${by}%`,
            transform: 'translate(-50%, -50%)',
            fontSize: 26,
            filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.6))',
            transition: phase === 'animating'
              ? 'left 0.5s cubic-bezier(0.25,0.46,0.45,0.94), top 0.5s cubic-bezier(0.25,0.46,0.45,0.94)'
              : 'none',
            zIndex: 5,
          }}>
            ⚽
          </div>

          {/* Clickable zones */}
          {phase === 'aim' && ZONES.map(z => (
            <div
              key={z.id}
              onClick={() => shoot(z.id)}
              title={`Shoot ${['top','mid','bot'][z.row]}-${['left','center','right'][z.col]}`}
              style={{
                position: 'absolute',
                left: `${z.col * 33.33}%`,
                top: `${z.row * 33.33}%`,
                width: '33.33%',
                height: '33.33%',
                cursor: 'crosshair',
                zIndex: 10,
                boxSizing: 'border-box',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,0,0.22)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            />
          ))}

          {/* Result flash overlay */}
          {phase === 'result' && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 20,
              background: isGoal ? 'rgba(34,197,94,0.28)' : 'rgba(239,68,68,0.28)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 44, fontWeight: 900,
                color: isGoal ? '#052e16' : '#450a0a',
                textShadow: isGoal
                  ? '0 0 24px rgba(74,222,128,0.9), 0 2px 4px rgba(0,0,0,0.4)'
                  : '0 0 24px rgba(239,68,68,0.9), 0 2px 4px rgba(0,0,0,0.4)',
                animation: 'zoomIn 0.28s ease',
              }}>
                {isGoal ? '⚽ GOAL!' : '🧤 SAVED!'}
              </span>
            </div>
          )}
        </div>

        {/* Goal base bar */}
        <div style={{
          height: 14,
          background: '#e8e8e8',
          borderLeft: '8px solid #f0f0f0',
          borderRight: '8px solid #f0f0f0',
          borderBottom: '8px solid #f0f0f0',
          borderRadius: '0 0 6px 6px',
          boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
        }} />

        {/* Ground with penalty spot */}
        <div style={{
          height: 48,
          background: 'linear-gradient(180deg, #3a8a3a, #2d6a2d)',
          borderRadius: '0 0 6px 6px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Penalty arc hint */}
          <div style={{
            position: 'absolute', top: 8,
            width: 80, height: 40,
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '0 0 999px 999px',
            borderTop: 'none',
          }} />
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: 'rgba(255,255,255,0.7)',
            boxShadow: '0 0 6px rgba(255,255,255,0.5)',
            position: 'relative', zIndex: 2,
          }} />
        </div>
      </div>

      {phase === 'aim' && (
        <p style={{ marginTop: 14, opacity: 0.7, fontSize: 14, textAlign: 'center' }}>
          Click anywhere in the goal to shoot — the keeper will dive randomly
        </p>
      )}

      {/* Game over modal */}
      {phase === 'gameover' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.78)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.3s ease',
        }}>
          <div style={{
            background: '#fff', color: '#111',
            borderRadius: 20, padding: '40px 48px',
            textAlign: 'center', maxWidth: 360, width: '90%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            animation: 'slideUp 0.32s ease',
          }}>
            <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>
              {finalScore === 5 ? '🏆' : finalScore >= 4 ? '🎉' : finalScore >= 3 ? '👏' : finalScore === 2 ? '😬' : '😢'}
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 24 }}>Full Time!</h2>
            <p style={{ margin: '0 0 4px', color: '#555', fontSize: 16 }}>You scored</p>
            <div style={{ fontSize: 60, fontWeight: 900, color: '#16a34a', lineHeight: 1, marginBottom: 4 }}>
              {finalScore}
            </div>
            <p style={{ margin: '0 0 16px', color: '#555', fontSize: 16 }}>out of {MAX_SHOTS}</p>

            {/* History dots */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 18 }}>
              {history.map((g, i) => (
                <span key={i} style={{ fontSize: 20 }}>{g ? '⚽' : '🧤'}</span>
              ))}
            </div>

            <p style={{ color: '#777', margin: '0 0 24px', fontSize: 15 }}>
              {finalScore === 5 ? '🌟 Perfect! World class finishing!' :
               finalScore === 4 ? 'Brilliant! Almost flawless!' :
               finalScore === 3 ? 'Decent effort — keep practicing!' :
               finalScore === 2 ? 'The keeper was on fire today.' :
               finalScore === 1 ? 'Tough day at the office.' :
               'The keeper saved everything! Try again.'}
            </p>

            <button
              onClick={restart}
              style={{
                background: '#16a34a', color: '#fff',
                border: 'none', borderRadius: 10,
                padding: '13px 32px', fontSize: 17, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 4px 14px rgba(22,163,74,0.4)',
                transition: 'transform 0.1s, box-shadow 0.1s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(22,163,74,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,163,74,0.4)'; }}
            >
              🔄 Shoot Again
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes zoomIn {
          from { transform: scale(0.3); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(28px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
