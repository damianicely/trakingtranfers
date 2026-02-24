# Hotel seed data

Put your extracted hotels in `hotels.json` as a JSON array. Each item must have:

- **name** (string) – hotel name
- **location** (string) – stage/location name, e.g. `"Lagos"`, `"Porto Covo"`, `"Vila Nova de Milfontes"`

Supported location names (mapped to trail stage ids in `scripts/seed-hotels.ts`):

- S. Torpes / São Torpes → ST  
- Porto Covo → PC  
- Vila Nova de Milfontes / Milfontes → VM  
- Almograve → AL  
- Zambujeira do Mar / Zambujeira → ZM  
- Odeceixe → OD  
- Aljezur → AJ  
- Arrifana → AR  
- Carrapateira → CP  
- Vila do Bispo → VB  
- Sagres → SA  
- Salema → SL  
- Luz → LZ  
- Lagos → LG  

Then run:

```bash
npm run seed:hotels
```

Requires `DATABASE_URL` in `.env` (and DB tunnel if you use one). Running the script again will insert the same hotels again (duplicates); clear or manage existing rows in the admin if needed.
