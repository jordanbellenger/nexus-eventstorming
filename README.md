## Nexus

Nexus est un PoC concu pour capter le besoin client pendant un atelier et generer directement un board MVP exploitable.

Pendant l'atelier, Nexus ecoute la conversation. Au fur et a mesure que le client decrit son metier, par exemple :

> "Quand une commande est payee, on alerte la logistique, et si le stock est vide, on rembourse le client"

l'IA modelise la logique en temps reel sur un grand ecran.

Les participants voient leur processus mental se dessiner sous leurs yeux sous forme de flux Event Storming. Si une etape manque, le trou dans le diagramme devient visible immediatement. A la fin de la reunion, un bouton permet de generer un backlog structure avec Epics et User Stories directement exploitable dans JIRA.

## Demarrage

Lancer le serveur de developpement :

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans le navigateur.

## Configuration

Creer ou completer `C:\Sources\nexus-app\.env.local` :

```env
ANTHROPIC_API_KEY=sk-ant-...
```

Redemarrer ensuite le serveur Next.js.

## Parcours du PoC

1. Demarrer l'ecoute live depuis le panneau de gauche.
2. Laisser Nexus retranscrire la conversation dans la zone de texte.
3. Attendre une pause dans l'atelier : l'analyse se relance automatiquement pour mettre a jour le board.
4. Reorganiser les noeuds si besoin directement sur le whiteboard.
5. Cliquer sur `Generer les tickets JIRA` pour produire un backlog Markdown avec Epics, User Stories et criteres BDD.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React Flow (`@xyflow/react`)
- Anthropic SDK
- Framer Motion

## Limites actuelles

- La transcription live repose sur la Web Speech API du navigateur.
- Le rendu courant cible un board Event Storming.
- La generation JIRA produit du Markdown structure, pas une creation directe de tickets via l'API Jira.

## Suite possible

- Export Jira via API native
- Support BPMN en plus d'Event Storming
- Historique de versions du board
- Multi-participants et annotation collaborative
