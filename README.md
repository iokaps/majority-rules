# Majority Rules

A Kokimoki concept.

## How to Play

1. **Share the QR code.** Players scan, pick a name, they are in.
2. **Set the questions.** Write your own, aim them at the room, or let AI generate a set.
3. **Put the board on the big screen.** The room watches the split land together.
4. **Pick the pace.** Fast is a warm-up. Slower, with a new room, it is an icebreaker.
5. **Start playing.** Rounds run about 30 seconds, and it gets better the bigger the room.

## Getting Started

### Prerequisites

- Node.js (v22 or higher)
- npm or yarn

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

This will start a local development server where you can test your concept.

### Building

Build the concept for production:

```bash
npm run build
```

### Uploading to Kokimoki

To upload your concept to Kokimoki, run:

```bash
kokimoki upload
```

**Important:** Before uploading again, you must update the version in `package.json`. You can do this:

1. Using the npm version command:

   ```bash
   npm version patch  # for bug fixes
   npm version minor  # for new features
   npm version major  # for breaking changes
   ```

2. Or manually edit the `version` field in `package.json`

Uploading with the same version will fail. Always increment the version before running `kokimoki upload` again.

## Learn More

Visit [kokimoki.com](https://kokimoki.com) for more information and documentation.
