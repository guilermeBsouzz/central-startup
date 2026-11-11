// Compatibility entry point. Preview is explicit in npm start / iniciar.cmd.
import('./src/server.mts').catch(error=>{console.error(error.message);process.exitCode=1;});
