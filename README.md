# 🧬 BIOLens

### AI-Powered Biomedical Intelligence • Disease Graphs • Drug Repurposing • Knowledge Discovery

<p align="center">
  <b>Turning biomedical data into connected, explainable intelligence.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI-Biomedical%20Intelligence-purple?style=for-the-badge">
  <img src="https://img.shields.io/badge/Neo4j-Knowledge%20Graph-blue?style=for-the-badge">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge">
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge">
  <img src="https://img.shields.io/badge/Docker-Containerized-2496ED?style=for-the-badge">
</p>

---

## 🔬 What is BIOLens?

**BIOLens is a biomedical intelligence platform designed to make complex biological relationships understandable, searchable, and actionable.**

Biomedical research is not just a collection of isolated facts.

A disease is connected to genes.  
Genes are connected to proteins.  
Proteins interact with pathways.  
Pathways influence biological processes.  
Drugs interact with targets.  
Targets influence diseases.

BIOLens turns these relationships into a **connected biomedical knowledge graph** and provides an intelligent interface for exploring them.

Instead of asking:

> *"What do we know about this disease?"*

BIOLens lets you explore:

> **"What is connected to this disease, how are those entities connected, and what potential therapeutic relationships exist?"**

---

# 🧠 Core Idea

```text
                    ┌──────────────┐
                    │   DISEASE    │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              ↓            ↓            ↓
           ┌──────┐    ┌───────┐    ┌──────┐
           │ GENES│    │PROTEIN│    │DRUGS │
           └──┬───┘    └───┬───┘    └───┬──┘
              │            │            │
              └────────────┼────────────┘
                           ↓
                    ┌──────────────┐
                    │  PATHWAYS    │
                    └──────┬───────┘
                           ↓
                    ┌──────────────┐
                    │ BIOLOGICAL   │
                    │   PROCESSES  │
                    └──────────────┘

BIOLens represents biomedical information as relationships rather than isolated records.

That makes it possible to discover connections that are difficult to see in traditional tables and documents.

🚀 Features
🕸️ Biomedical Knowledge Graph

At the heart of BIOLens is a graph-based representation of biomedical knowledge.

Instead of storing information only as rows and columns, BIOLens models entities and their relationships.

Example:

Disease
   ↓
Associated Gene
   ↓
Protein
   ↓
Pathway
   ↓
Drug Target
   ↓
Potential Drug

This structure allows complex biological relationships to be queried naturally.

💊 Drug Repurposing

BIOLens can be used to explore relationships between:

Diseases
Drugs
Biological targets
Genes
Proteins
Pathways
Mechanisms

The goal is to help identify potential therapeutic connections worth investigating.

BIOLens is a research and exploration tool, not a clinical decision-making system.

🔎 Intelligent Biomedical Search

Search biomedical entities and navigate through their connected biological context.

Instead of returning a single result, BIOLens can expose the network surrounding the entity.

🧬 Relationship Discovery

Biomedical knowledge becomes much more useful when relationships are visible.

BIOLens focuses on questions such as:

What genes are associated with this disease?

Which proteins are connected to these genes?

Which pathways involve those proteins?

Which drugs interact with relevant targets?

What other diseases share similar biological mechanisms?
📊 Biomedical Data Visualization

Complex biological networks can become impossible to understand when represented only as text.

BIOLens transforms those relationships into interactive visual exploration.

                Disease
               /   |   \
              /    |    \
           Gene  Protein  Drug
             \      |      /
              \   Pathway /
               \    |    /
                Biological
                 Process
🏗️ Architecture
                       ┌─────────────────────┐
                       │      BIOLens UI     │
                       │   React / TanStack  │
                       └──────────┬──────────┘
                                  │
                                  │ HTTP
                                  ↓
                       ┌─────────────────────┐
                       │    FastAPI Backend  │
                       │      Python         │
                       └──────────┬──────────┘
                                  │
                                  │ Bolt
                                  ↓
                       ┌─────────────────────┐
                       │        Neo4j        │
                       │ Biomedical Graph DB │
                       └─────────────────────┘
Frontend

Built for an interactive biomedical exploration experience.

Backend

Provides the API layer responsible for communicating with the knowledge graph and serving biomedical data.

Neo4j

Stores the biomedical entities and their relationships as a graph.

Docker

Packages the application components into reproducible containers.

🧩 Tech Stack
Layer	Technology
Frontend	React
Framework	TanStack Start
Build Tool	Vite
Styling	Tailwind CSS
Backend	Python
API	FastAPI
Database	Neo4j
Graph Protocol	Bolt
Containerization	Docker
Orchestration	Docker Compose
🗂️ Project Structure
BIOLens/
│
├── biolens-backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── ...
│
├── src/
│   ├── routes/
│   ├── components/
│   ├── lib/
│   └── ...
│
├── public/
│
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── package.json
├── vite.config.ts
├── RUN_BIOLENS.md
└── README.md
🐳 Running BIOLens

BIOLens is containerized so the frontend and backend can be started together.

1. Start Neo4j

Open Neo4j Desktop and start the database used by BIOLens.

Make sure the Neo4j Bolt service is available on:

localhost:7687
2. Start BIOLens

From the project root:

docker compose up -d

Check the containers:

docker ps
3. Open BIOLens

Frontend:

http://localhost:3000

Backend:

http://localhost:8000

Backend health/database test:

http://localhost:8000/test

Or:

curl http://localhost:8000/test

A successful response should indicate that the backend is connected to Neo4j.

🛑 Stopping BIOLens

To stop the project:

docker compose down

This stops and removes the BIOLens containers and Compose network.

Your Docker images and Neo4j database are not deleted.

To start again:

docker compose up -d
🔧 Development

Install frontend dependencies:

npm install

Run the frontend development environment:

npm run dev

Build the frontend:

npm run build

For the containerized production-style environment:

docker compose build
docker compose up -d
🧪 Health Check

BIOLens exposes a backend test endpoint:

curl http://localhost:8000/test

Example:

{
  "status": "connected",
  "nodes": 1190
}

The node count represents the number of graph nodes currently accessible through the configured Neo4j database.

🔐 Environment Variables

Sensitive configuration such as database credentials should be stored in environment variables.

Example:

NEO4J_URI=bolt://host.docker.internal:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<your-password>

Never commit real passwords, API keys, or secrets to GitHub.

🧬 Why a Knowledge Graph?

Traditional databases are excellent at answering:

"Give me the information stored in this row."

Biomedical research often asks something much more complicated:

"Show me everything connected to this biological entity and explain how those things relate."

Graphs are naturally suited for this.

A biomedical graph can represent:

              ┌─────────┐
              │ Disease │
              └────┬────┘
                   │
              ASSOCIATED_WITH
                   │
                   ↓
                ┌──────┐
                │ Gene │
                └──┬───┘
                   │
              ENCODES
                   │
                   ↓
               ┌─────────┐
               │ Protein │
               └────┬────┘
                    │
              INVOLVED_IN
                    │
                    ↓
               ┌─────────┐
               │ Pathway │
               └────┬────┘
                    │
               TARGETED_BY
                    │
                    ↓
                 ┌─────┐
                 │Drug │
                 └─────┘

This is the foundation of BIOLens.

🎯 Vision

BIOLens aims to become a unified interface for exploring biological knowledge as a connected system.

The long-term vision is to bridge:

DATA
 ↓
KNOWLEDGE
 ↓
RELATIONSHIPS
 ↓
DISCOVERY
 ↓
RESEARCH

Biomedical information shouldn't feel like searching through disconnected databases.

It should feel like exploring a living network.

⚠️ Disclaimer

BIOLens is intended for research, educational, and exploratory purposes.

Any drug-disease associations, biological relationships, predictions, or potential repurposing candidates surfaced by the platform should be independently validated through appropriate scientific research.

BIOLens does not provide medical diagnosis, treatment recommendations, or clinical advice.

👨‍💻 Built With

Built as a biomedical technology project combining:

Artificial Intelligence × Knowledge Graphs × Biomedical Data × Interactive Visualization

<p align="center">
🧬 Explore the biology behind the data.

BIOLens

</p> ```

## Contributors

Harshit Chaturvedi

---

## License

School Of BioComputing NUS Singapore

---

## Disclaimer

BioLens is intended for educational and research purposes only. The platform does not provide medical advice, diagnosis, or treatment recommendations. Any insights generated should be validated through appropriate scientific and clinical evaluation.
