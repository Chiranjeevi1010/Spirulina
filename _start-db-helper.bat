@echo off
cd /d R:\Softwares\Spirulina
if exist data\pg\postmaster.pid del /f data\pg\postmaster.pid
npx tsx scripts/start-db.ts
