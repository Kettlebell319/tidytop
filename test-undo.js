const { UndoManager } = require('./src/core/organize/undo');

async function testUndo() {
  console.log('🔄 Testing TidyTop Undo Functionality...\n');
  
  const undoManager = new UndoManager();
  
  try {
    // Test the undo logic
    const results = await undoManager.undoLastClean();
    
    console.log('✅ Undo Results:');
    console.log(`   ↩️  Files restored: ${results.undoCount}`);
    console.log(`   ❌ Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach(error => {
        console.log(`   ${error.move.from}: ${error.error}`);
      });
    }
    
    console.log('\n🎉 Undo test completed successfully!');
    
  } catch (error) {
    console.error('❌ Undo test failed:', error);
  }
}

testUndo().then(() => {
  console.log('\n🏁 Undo test script finished');
}).catch(console.error);