// AlbumCard — ugyanaz a múzeumi tábla-kártya, mint a DinoCard, EGYETLEN
// különbséggel: itt a TELJES description_hu megjelenik (a DinoCard-on nincs
// leírás). Egyetlen forrás: a DinoCard `showDescription` propja. Kattintásra a
// kártya képernyő-magasságú modálban nyílik ki (lásd DinoCard).
//
// Elfogad `dino` VAGY (legacy hívóknak) `creature` propot.
import React from 'react';
import DinoCard from './DinoCard';

export default function AlbumCard({ dino, creature, onPress }) {
  return <DinoCard dino={dino || creature} onPress={onPress} showDescription />;
}
