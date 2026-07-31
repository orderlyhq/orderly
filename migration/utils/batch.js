async function commitBatch(db, writes){

    if(writes.length === 0)
        return;


    let batch = db.batch();


    writes.forEach(item=>{

        batch.set(
            item.ref,
            item.data,
            {merge:true}
        );

    });


    await batch.commit();

}


module.exports = commitBatch;