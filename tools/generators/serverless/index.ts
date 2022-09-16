import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  joinPathFragments,
  Tree,
} from '@nrwl/devkit';
import { addJest } from './jest-config';
import { Schema } from './schema';
import { addWorkspaceConfig } from './workspace-config';

export default async (host: Tree, schema: Schema) => {
  const stackRoot = `stacks/${schema.name}`;
  function pascal(val: string) {
    return val.charAt(0).toUpperCase() + val.slice(1);
  }

  generateFiles(
    host, // the virtual file system
    joinPathFragments(__dirname, './files'), // path to the file templates
    stackRoot, // destination path of the files
    { ...schema, tmpl: '' } // config object to replace variable in file templates
  );

  addWorkspaceConfig(host, schema.name, stackRoot);

  await addJest(host, schema.name);

  await formatFiles(host);

  return () => {
    installPackagesTask(host);
  };
};
