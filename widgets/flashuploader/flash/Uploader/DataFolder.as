package Uploader {
	import flash.net.FileFilter;
	import flash.net.URLRequest;
	import flash.net.URLRequestMethod;
	import flash.net.URLRequestHeader;	
    import flash.net.URLVariables;
	import flash.net.navigateToURL;
	import flash.net.URLLoader;
	
	public class DataFolder {
		/* citac */
		private static var _idCount:Number = 0; 
		private static const MAX_ID:Number = 1000000;
		private static function _getId():String{
			if(DataFolder._idCount > DataFolder.MAX_ID){
				DataFolder._idCount = 0;
			}
			var id:String = 'm' + new Date().getTime().toString(16) + 'm' + DataFolder._idCount.toString(16);
			DataFolder._idCount++;
			return id;
		}


		/* id javascriptove aplikace, ktere data patri */
		public var id:String;
		/* data HTTP requestu, ktery odesila soubory */
		public var request:URLRequest;
		/* dalsi data ktera se odesilaji POSTem se soubory */
		public var formData:URLVariables;		
		/* pole file filteru pro dialogove okno */
		public var fileTypes:Array;		
		/* minimalni velikost souboru */
		public var minSize:Number;
		/* macimalni velikost souboru */
		public var maxSize:Number;
		/* maximalni pocet souboru */
		public var maxFilesCount:Number;
		/* vybrana data */
		public var uploadData:Object;
		/* celkovy pocet vybranych souboru */
		public var dataLength:Number;
		/* celkova velikost vybranych souboru */
		public var filesSize:Number;
		/* pole id nahravanych dat */
		public var dataIndex:Array;
		
		
		public var uploadedCount:Number;
		public var uplodadErrCount:Number;
		public var uploadPossCount:Number;
		
		/* reperence na hlavni tridu balicku */
		private var main:Object;
		
		
		public function DataFolder(main:Object,id:String,myUrl:String,flFilter:Array,mFormData:Object,minSize:Number,maxSize:Number,maxFilesCount:Number){
			this.main = main;
			this.id = id;
			
			/* request */
			this.request = new URLRequest();
			this.request.method = URLRequestMethod.POST;
			this.request.url = myUrl;
			var header:URLRequestHeader = new URLRequestHeader("Content-type", "multipart/form-data");
			this.request.requestHeaders.push(header);
			/* dodatecna data */
			this.formData = new URLVariables();
			/* typy souboru */
			
			this.fileTypes = this.setFileTypes(flFilter);
			/* nastaveni dodatecnych dat */
			if(mFormData){
				this.setFormData(mFormData);
			}
			this.minSize = minSize;
			this.maxSize = maxSize;
			this.maxFilesCount = maxFilesCount;
			//this.count = 0;
			this.dataLength = 0;
			this.uploadData = new Object();
			this.dataIndex = new Array();
			this.uploadedCount = 0;
			this.uploadPossCount = 0;
		}
		
		/* operace s dodatecnymi dady posilanymi pres POST */
		/* nastaveni (pridani) dalsich odesilanych dat */
		public function setFormData(fData:Object):void{
			for(var i:String in fData){
				this.formData[i] = fData[i];
			}
			this.resetFormData();
		};
		/* vraci vsechna akrualne nastavena dodatecna data */
		public function getFormData():Object{
			return this.formData;
		};
		/* odebira jednu dodatecnou datovou polozku dle jejiho nazvu */
		public function removeFormData(fDataName:String):void{
			this.formData[fDataName] = null;
			delete(this.formData[fDataName]);
			this.resetFormData();
		};
		/* odebere vsechna dodatecne odesilana data */
		private function resetFormData():void{
			this.request.data = this.formData;
		};
		
		/* operace se souborovymi filtry pro dialogove okno */
		/* vraci souborove filtry pro dany objekt */
		public function getFileTypes():Array{
			return this.fileTypes;
		}
		/* nastavuje souborove filtry */
		private function setFileTypes(flt:Array):Array{
			var out:Array = new Array();
			for(var i:int = 0; i < flt.length; i++){
				out.push(new FileFilter(flt[i].desc,flt[i].types));
			}
			return out;
		}
		/* operace s vlastni definici requestu */
		/* vraci definici HTTP requestu */
		public function getRequest():URLRequest{
			return this.request;
		}
		
		/* prace svybranymi daty */
		/* pridani souboru do vyberu*/
		public function addUploadItem(dt:Object):String{
			
			var file:Object = dt;
			var status:String = 'selected';
			var error:Boolean = false;
			var errorType:Number = 0;
			var id:String = DataFolder._getId();
			
			var testSize:Number = this._testSizeOverrun(file);
			
			var item:Object = {
				file : file,
				error:testSize,
				id:id,
				status:status,
				index:this.dataIndex.length,
				uploadSize:0
			}
			
			if(!testSize && (!this.maxFilesCount || (this.dataLength < this.maxFilesCount))){
				this.dataLength++;
				this.uploadPossCount++;
				this.filesSize += dt.size;
			}
			
			this.uploadData[id] = item;
			this.dataIndex.push(id);
			
			return id;
		}		
		
		public function getUploadData():Object{
			return this.uploadData;
		}

		public function getUploadDataByFile(fl:Object):*{
			for(var i:String in this.uploadData){
				if(fl == this.uploadData[i].file){
					return this.uploadData[i];
				}
			}
			return false;
		}
		
		public function getDataIndex():Array{
			return this.dataIndex;
		}
		
		public function rebuildDataIndex():void{
			var newIndex:Array = new Array();
			for(var i:int = 0; i < this.dataIndex.length; i++){
				var name:String = this.dataIndex[i];
				if(this.uploadData[name]){
					var num:Number = newIndex.length;
					newIndex.push(name);
					this.uploadData[name].index = num;
				} else {
					delete(this.uploadData[name]);
				}
			}
			this.dataIndex = newIndex;
		}
		
		private function _testSizeOverrun(file:Object):Number{
			if( this.maxSize && (file.size > this.maxSize)){
				return  1;
			} else if(this.minSize && (file.size < this.minSize)){
				return 2;			
			} else {
				return 0;

			}
		}
		
		
		/* odebrani souboru z vyberu */
		public function removeUploadItem(id:String):void{
			var removedItem:Object = this.uploadData[id];
			var removedIndex:Number = removedItem.index;
			
			this.filesSize -= removedItem.file.size; 
			/* odstranim vybrany soubor z fronty */
			if((this.uploadData[id].error < 1 || this.uploadData[id].error > 4) 
			&& (this.dataIndex.length <= this.maxFilesCount) && (this.uploadData[id].status != 'uploaded')){
				this.dataLength--;
				this.uploadPossCount--;
			}
			this.uploadData[id] = null;
			delete(this.uploadData[id]);
			
			/* odstranim polozku z indexoveho pole */
			this.dataIndex.splice(removedIndex,1)
			/* pregeneruji odkazy na indexove pole */
			for(var i:int = 0; i < this.dataIndex.length; i++){
				this.uploadData[this.dataIndex[i]].index = i;
			}
			
			if(!this.dataIndex.length){
				// zadny soubor ve fronte
			} else {
				// jeste nam neco zbyva
			}
		}
		/* vyprazdneni celeho vyberu */
		public function clearUploadData():void{
			this.uploadData = new Object();
			this.dataIndex = new Array();
			this.dataLength = 0;
			this.filesSize = 0;
		}
		public function getFilesSize():Number{
			return this.filesSize;
		}		
		public function increaseDataLength():void{
			this.dataLength++;
		}
		public function decreaseDataLength():void{
			this.dataLength--;
		}
		public function getDataLength():Number{
			return this.dataLength;
		}

		public function updateItemData(data:Object):void{
			this.uploadData[data.index][data.field] = data.value;
		}
		
		public function clear():void{
			this.uploadData = new Object();
			this.dataIndex = new Array();
			this.dataLength = 0;
			this.filesSize = 0;
			this.uploadPossCount = 0;
			this.uploadedCount = 0;
		}
		public function rebuildPossCount():void{
			var num:Number = 0;
			var possibleCount:Number = !this.maxFilesCount ? -1 : this.maxFilesCount - this.uploadedCount
			
			if(possibleCount < 0){
				this.uploadPossCount = this.dataIndex.length
			} else if(possibleCount == 0){
				this.uploadPossCount = 0
			} else {
				this.uploadPossCount = possibleCount;
			}
			return;

		}
	}
}
