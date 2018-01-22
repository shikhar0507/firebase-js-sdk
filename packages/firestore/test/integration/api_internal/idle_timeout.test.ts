/**
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { apiDescribe, withTestDb } from '../util/helpers';
import { drainAsyncQueue } from '../util/internal_helpers';
import { Deferred } from '../../util/promise';

apiDescribe('Idle Timeout', persistence => {
  it('can write document after idle timeout', () => {
    return withTestDb(persistence, db => {
      const docRef = db.collection('test-collection').doc();
      return docRef
        .set({ foo: 'bar' })
        .then(() => {
          return drainAsyncQueue(db);
        })
        .then(() => docRef.set({ foo: 'bar' }));
    });
  });

  it('can watch documents after idle timeout', () => {
    return withTestDb(persistence, db => {
      const awaitOnlineSnapshot = () => {
        const docRef = db.collection('test-collection').doc();
        const deferred = new Deferred<void>();
        const unregister = docRef.onSnapshot(
          { includeMetadataChanges: true },
          snapshot => {
            if (!snapshot.metadata.fromCache) {
              deferred.resolve();
            }
          }
        );
        return deferred.promise.then(unregister);
      };

      return awaitOnlineSnapshot()
        .then(() => {
          return drainAsyncQueue(db);
        })
        .then(() => awaitOnlineSnapshot());
    });
  });
});