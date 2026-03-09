import mysql2 from 'mysql2';
import type { Connection, ConnectionOptions } from 'mysql2';
import * as R from 'ramda';

let connectionOps: ConnectionOptions | null = null;

function wrapDbOperation<T>(fn: (connection: Connection) => Promise<T>): Promise<T> {
    const connection = mysql2.createConnection(connectionOps!);

    return new Promise<T>(function (resolve, reject) {
        connection.connect(function (err) {
            if (err) {
                connection.end();
                reject(err);
            } else {
                const end = R.curry(function (fail: boolean, result: any) {
                    connection.end();
                    return fail ? reject(result) : resolve(result);
                });

                fn(connection)
                    .then(end(false), end(true));
            }
        });
    });
}

function transaction(fns: Array<(connection: Connection) => Promise<any>>): Promise<any[]> {
    return wrapDbOperation(function (connection) {
        const fnCaller = function (queryFn: (connection: Connection) => Promise<any>) {
            return queryFn(connection);
        };
        return new Promise(function (resolve, reject) {
            connection.beginTransaction(function (beginErr) {
                if (beginErr) {
                    reject(beginErr);
                } else {
                    Promise.all(R.map(fnCaller, fns))
                        .then(function (result) {
                            connection.commit(function (commitErr) {
                                if (commitErr) {
                                    connection.rollback(function () {
                                        reject(commitErr);
                                    });
                                } else {
                                    resolve(result);
                                }
                            });
                        }, function (fnErr) {
                            connection.rollback(function () {});
                            reject(fnErr);
                        });
                }
            });
        });
    });
}

function storedQueryFn(sql: string, tokens: any[]): (connection: Connection) => Promise<any> {
    return function (connection: Connection) {
        return new Promise(function (resolve, reject) {
            connection.query(sql, tokens, function (err: any, rows: any) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    };
}

function query(sql: string, tokens?: any[]): Promise<any> {
    return wrapDbOperation(function (connection) {
        return new Promise(function (resolve, reject) {
            connection.query(sql, tokens, function (err: any, rows: any) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    });
}

function verifyDb(connection: Connection): Promise<any[]> {
    return new Promise(function (resolve, reject) {
        connection.query(
            'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
            [(connectionOps as any).database],
            function (err: any, rows: any) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

function createDb(connection: Connection): Promise<any> {
    return new Promise(function (resolve, reject) {
        connection.query(
            'CREATE DATABASE ' + (connectionOps as any).database,
            [],
            function (err: any, rows: any) {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

const db = {
    init: function (storeCfg: { params: ConnectionOptions }) {
        connectionOps = storeCfg.params;
        const connection = mysql2.createConnection({
            host: (connectionOps as any).host,
            user: (connectionOps as any).user,
            password: (connectionOps as any).password
        });
        const end = function () { connection.end(); };

        return verifyDb(connection)
            .then(function (result) {
                if (!result.length) {
                    return createDb(connection).then(end);
                } else {
                    end();
                }
            }, function (err) {
                end();
                return Promise.reject(err);
            });
    },
    name: function () { return (connectionOps as any).database; },
    query: query,
    execTransaction: transaction,
    createStoredQuery: storedQueryFn
};

export default db;
