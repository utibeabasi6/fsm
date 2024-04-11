import * as sqlite3 from "sqlite3";

export function updateDatabase({ key, fileName }: { fileName: string, key: string }) {
    return new Promise((resolve, reject) => {
        let db = new sqlite3.Database('./data.sqlite', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
            if (err) {
                reject(err)
            }
            db.exec(`
            create table if not exists images (
                id integer primary key,
                key text not null,
                location text not null
            );
            `);
            db.exec(`
            insert into images values (NULL, '${key}', 'file:///${fileName}');
            `);
            resolve("done")
        });
    })
}

