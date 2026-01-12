# MilkBook - Automatic Milk Collection & Dairy Accounting System

**Designed by signimus**

A complete dairy management system that transforms machine readings from milk analyzers into business operations for Indian Village Level Collection Centers (VLCCs) and milk procurement centers.

## Features

- **Automatic Milk Collection**: Real-time recording of milk quantity, fat, and SNF percentages
- **Farmer Management**: Complete farmer registration and profile management
- **Payment Tracking**: Detailed payment records with bonuses and deductions
- **Ledger System**: Comprehensive transaction history and farmer passbooks
- **Sales Management**: Milk, feed, and ghee sales tracking
- **Inventory Control**: Feed stock and product inventory management
- **Reporting**: Daily, weekly, and monthly reports with efficiency metrics
- **Offline-First**: Works completely offline with local data storage
- **Labour vs Owner Mode**: Different interfaces for collection staff and administrators
- **Rush Hour Protection**: Immutable entries during high-pressure collection periods

## Architecture

- **HTML/CSS/JS Only**: No build tools required for runtime
- **IndexedDB**: Local storage for offline functionality
- **Service Worker**: Offline caching and sync capabilities
- **Tailwind-Inspired CSS**: Clean, responsive design
- **Lucide Icons**: Beautiful, consistent iconography

## Operational Safeguards

Following Nyay-Shastra principles for error prevention:

1. **Quarantine Mode**: All entries marked as "QUARANTINED" until synced to server
2. **Immutable Entries**: No editing/deleting during collection hours
3. **Labour vs Owner Separation**: Different interfaces with different capabilities
4. **Rush Hour Locks**: Navigation locked during peak collection times
5. **Manual Entry Flagging**: All manual entries clearly marked and differentiated
6. **Single-Screen Labour Mode**: Simplified interface for collection staff
7. **Audit Trail**: Complete metadata for every transaction

## Deployment

This is a static HTML application that can be deployed to any web server or hosting platform.

## License

This software is designed for Indian dairy cooperatives and village milk collection centers. The system prioritizes transparency, accountability, and operational resilience over feature complexity.

## Designer Attribution

This system was designed by **signimus** with focus on Indian rural dairy operations.